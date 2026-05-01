export const words: { [key: string]: string[] } = {

  "easy": [
    "circuit", "plasma", "laser", "matrix", "vector", "robot", "drone", "pixel", "glitch", "cyber",
    "synth", "neon", "pulse", "spark", "flare", "blast", "shock", "surge", "beam", "code",
    "byte", "data", "chip", "node", "grid", "wire", "scan", "sync", "loop", "ping",
    "hack", "bot", "cloud", "app", "bug", "file", "link", "port", "host", "script",
    "pixel", "cache", "zoom", "frame", "debug", "console", "disk", "log", "node", "path",
    "packet", "link", "bit", "byte", "subnet", "access", "route", "stream", "update", "crash",
    "data", "block", "load", "input", "output", "system", "process", "thread", "admin", "user",
    "log", "debug", "reset", "alert", "prompt", "site", "app", "modal", "cursor", "active", "error",
    "menu", "flag", "text", "icon", "screen", "tab", "input", "panel", "alert", "page", "map", "key",
    "move", "click", "exit", "enter", "fetch", "view", "matrix", "font", "style", "script", "cursor", 
    "font", "email", "cloud", "link", "memo", "tools", "disk", "file", "menu", "step", "path"
  ],
  "medium": [
    "algorithm", "bandwidth", "compiler", "database", "ethernet", "firewall", "gateway", "hardware", "interface", "kernel",
    "mainframe", "network", "protocol", "quantum", "runtime", "software", "terminal", "uplink", "virtual", "wireless",
    "firestorm", "overdrive", "catalyst", "velocity", "momentum", "resonance", "spectrum", "neutron", "isotope", "reactor",
    "compression", "authentication", "encryption", "session", "process", "resource", "stack", "cloud", "drive", "cache",
    "debugger", "server", "database", "query", "algorithm", "function", "compiler", "command", "variable", "memory",
    "client", "sync", "batch", "codebase", "content", "deploy", "layer", "debug", "access", "shell", "packet",
    "system", "client", "console", "build", "network", "hyperlink", "element", "buffer", "timeout", "monitor",
    "wireframe", "accessory", "subsystem", "package", "module", "signal", "burst", "raster", "connector", "microchip",
    "polymorph", "manager", "thread", "sync", "router", "refresh", "datapath", "service", "cluster", "stack",
    "token", "binary", "template", "node", "refresh", "cache", "hash", "trace", "event", "timestamp",
    "host", "input", "output", "debugging", "dataflow", "exception", "networking", "packet", "dependency", "worker",
    "interface", "query", "session", "dynamic", "override", "subroutine", "wrapper", "unit", "output", "backbone"
  ],
  "hard": [
    "architecture", "cryptography", "cybernetics", "encapsulation", "hyperdrive", "infrastructure", "microprocessor", "nanotechnology", "optimization", "polymorphism",
    "subroutine", "synchronization", "telemetry", "transmission", "vulnerability", "workstation", "overclocking", "motherboard", "authentication", "authorization",
    "asynchronous", "multithreading", "virtualization", "biodigital", "electromagnetic", "thermodynamics", "intergalactic", "metaphysical", "superconductor", "singularity",
    "microarchitecture", "biotechnology", "cryptanalysis", "datacenter", "microcontroller", "robotics", "complexity", "parallelism", "circuitry", "neurotechnology",
    "semiconductor", "biocompatible", "transistor", "machinelearning", "cybersecurity", "neuralnetwork", "deep learning", "cloudcomputing", "augmentedreality", "blockchain",
    "nanostructure", "smartcontract", "nanotechnology", "cryptocurrency", "decentralized", "polymorphism", "algorithms", "systematic", "autonomous", "informationsecurity",
    "distributed", "scalability", "loadbalancer", "cloudstorage", "computational", "mining", "fuzzing", "darknet", "sidechannel", "exfiltration", "decryption",
    "infrastructure", "serverless", "firmware", "packetstorm", "artificialintelligence", "networking", "botnet", "quantumcomputing", "dataintelligence", "virtualreality",
    "digitization", "asymmetry", "blockchain", "computational", "obfuscation", "orchestration", "datamining", "heuristics", "falsifiability", "hyperparameter",
    "topology", "persistence", "iteration", "validation", "inversion", "cyberattack", "penetration", "vulnerability", "cloudnative", "threading", "algorithmic",
    "federation", "parallelism", "segmentation", "replication", "differentiation", "concurrency", "logistic", "backpropagation", "reflection", "precision",
    "orchestration", "realization", "datastore", "dependency", "obsolescence", "framework", "multiprocessing", "fractal", "quantum", "exponentiation",
    "entropy", "refactoring", "debugging", "hardware", "algorithm", "userinterface", "systemlevel", "memorymanagement", "synapse", "autonomous", "causality"
  ],

  custom: []
};

export function getRandomWord(difficulty: 'easy' | 'medium' | 'hard') {
  const list = words.custom && words.custom.length > 0 
      ? words.custom 
      : (words[difficulty] && words[difficulty].length > 0 ? words[difficulty] : words['medium']);
  return list[Math.floor(Math.random() * list.length)];
}
