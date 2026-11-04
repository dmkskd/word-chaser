import cytoscape from 'cytoscape';

/** All word-specific behaviour comes from a validated case graph. */
export class Investigation {
  constructor(catalog, wordCase, snapshot = {}) {
    this.catalog = catalog;
    this.case = wordCase;
    this.graph = cytoscape({headless: true, styleEnabled: false, elements: [
      ...wordCase.nodes.map(node => ({group: 'nodes', data: node})),
      ...wordCase.edges.map(edge => ({group: 'edges', data: edge}))
    ]});
    this.currentId = wordCase.startNodeId;
    this.visited = new Set([this.currentId]);
    this.inspected = new Set([this.currentId]);
    this.reviewed = new Set();
    this.history = [];
    this.actions = [];
    this.tested = new Set();
    this.attempts = new Map();
    this.revealed = new Map();
    this.awards = new Map();
    this.points = 0;
    // Restore by replaying valid graph moves, rather than trusting arbitrary saved IDs.
    if (snapshot && Array.isArray(snapshot.actions)) for (const action of snapshot.actions.slice(0, 10000)) {
      if (action?.type === 'follow' && this.availableIds().includes(action.nodeId)) { this.inspect(action.nodeId); const edge = this.linkTo(action.nodeId); if (!edge || this.tested.has(edge.id) || this.visited.has(action.nodeId)) this.follow(action.nodeId); }
      else if (action?.type === 'back') this.back();
      else if (action?.type === 'return' && this.visited.has(action.nodeId)) this.returnTo(action.nodeId);
      else if (action?.type === 'answer' && this.availableIds().includes(action.nodeId)) { this.inspect(action.nodeId); this.answer(action.nodeId, action.choiceId); }
      else if (action?.type === 'reveal' && this.availableIds().includes(action.nodeId)) { this.inspect(action.nodeId); this.reveal(action.nodeId); }
    }
  }
  node(id = this.currentId) { return this.graph.getElementById(id).data(); }
  edge(id) { return this.graph.getElementById(id).data(); }
  outgoing(id = this.currentId) { return this.graph.getElementById(id).outgoers().edges().map(edge => edge.data()); }
  leads() {
    const edges = [...this.outgoing(), ...[...this.visited].flatMap(id => this.outgoing(id))];
    const byTarget = new Map();
    for (const edge of edges) if (!this.visited.has(edge.target) && !byTarget.has(edge.target)) byTarget.set(edge.target, edge);
    return [...byTarget.values()];
  }
  availableIds() { return [...new Set([...this.visited, ...this.leads().map(edge => edge.target)])]; }
  linkTo(id) { return this.outgoing().find(edge => edge.target === id) || this.graph.getElementById(id).incomers().edges().map(edge => edge.data()).find(edge => this.visited.has(edge.source)) || null; }
  nodeStatus(id) {
    if (!this.visited.has(id)) return 'undecided';
    if (id === this.case.startNodeId) return 'connected';
    const incoming = this.graph.getElementById(id).incomers().edges().map(edge => edge.data()).filter(edge => this.reviewed.has(edge.id));
    return incoming.some(edge => this.catalog.relations[edge.type].outcome === 'connected') ? 'connected' : incoming.length ? 'excluded' : 'connected';
  }
  inspect(id) {
    if (!this.availableIds().includes(id)) throw new Error('That evidence is not an available lead.');
    this.inspected.add(id);
    return {node: this.node(id), edge: this.linkTo(id), visited: this.visited.has(id)};
  }
  reveal(id) {
    if (!this.inspected.has(id)) throw new Error('Inspect the evidence first.');
    const page = this.revealed.get(id) || 0;
    if (page < this.node(id).evidence.pages.length) {
      this.revealed.set(id, page + 1); this.actions.push({type: 'reveal', nodeId: id});
    }
    return this.node(id).evidence.pages[Math.min(page, this.node(id).evidence.pages.length - 1)];
  }
  answer(id, choiceId) {
    if (!this.inspected.has(id)) throw new Error('Inspect the evidence first.');
    const edge = this.linkTo(id);
    if (!edge) throw new Error('There is no new theory to test here.');
    const choice = edge.challenge.choices.find(answer => answer.id === choiceId);
    if (!choice) throw new Error('Unknown answer.');
    if (this.tested.has(edge.id)) return {correct: true, feedback: 'This clue is already in your notebook.', earned: 0, alreadySolved: true};
    this.actions.push({type: 'answer', nodeId: id, choiceId});
    if (!choice.correct) {
      this.attempts.set(edge.id, (this.attempts.get(edge.id) || 0) + 1);
      const deducted = Math.min(this.points, this.catalog.rules.wrongPenalty); this.points -= deducted;
      return {correct: false, feedback: choice.feedback, deducted, potentialReward: this.catalog.rules.assistedPoints};
    }
    const assisted = (this.revealed.get(id) || 0) > 0 || (this.attempts.get(edge.id) || 0) > 0;
    const earned = assisted ? this.catalog.rules.assistedPoints : this.catalog.rules.correctPoints;
    this.points += earned; this.tested.add(edge.id); this.awards.set(edge.id, earned);
    return {correct: true, feedback: choice.feedback, earned};
  }
  follow(id) {
    if (!this.inspected.has(id)) throw new Error('Inspect the evidence before following it.');
    const edge = this.linkTo(id);
    if (!edge && !this.visited.has(id)) throw new Error('There is no relationship supporting that move.');
    if (id === this.currentId) return;
    if (edge && !this.tested.has(edge.id)) throw new Error('Test your theory before following the clue.');
    if (edge) this.reviewed.add(edge.id);
    this.visited.add(id);
    // Ruling out a comparison records it, while keeping the other leads in view.
    if (!edge || this.catalog.relations[edge.type].outcome !== 'excluded') {
      this.history.push(this.currentId); this.currentId = id;
    }
    this.actions.push({type: 'follow', nodeId: id});
  }

  returnTo(id) {
    if (!this.visited.has(id)) throw new Error('That stop has not been discovered yet.');
    if (id !== this.currentId) { this.history.push(this.currentId); this.currentId = id; this.actions.push({type: 'return', nodeId: id}); }
  }
  back() { const id = this.history.pop(); if (id) { this.currentId = id; this.actions.push({type: 'back'}); } return this.currentId; }
  get complete() { return this.case.goalNodeIds.every(id => this.visited.has(id)); }
  get remainingGoals() { return this.case.goalNodeIds.filter(id => !this.visited.has(id)); }
  snapshot() { return {actions: [...this.actions]}; }
  destroy() { this.graph.destroy(); }
  /** Include visited connections and current candidate leads; don't invent endpoints. */
  visibleEdges() { return this.graph.edges().map(edge => edge.data()).filter(edge => this.reviewed.has(edge.id) || edge.source === this.currentId); }
}
