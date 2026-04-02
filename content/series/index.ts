export interface Series {
  slug: string;
  title: string;
  emoji: string;
  description: string;
  posts: string[];
}

export const allSeries: Series[] = [
  {
    slug: "machine-learning",
    title: "Machine Learning",
    emoji: "🧠",
    description: "From gradient descent to full MLOps pipelines",
    posts: [
      "gradient-descent", "backpropagation", "loss-functions-in-ml",
      "overfitting", "cross-validation", "hyperparameter-tuning",
      "activation-functions", "neural-network-layers", "transfer-learning",
      "training-vs-inference", "ml-evaluation-metrics",
      "ml-automation-pipelines", "mlops", "preparing-datasets-for-ml",
      "deploying-an-ml-model-online", "using-google-colab-for-ml",
    ]
  },
  {
    slug: "ai-and-deep-learning",
    title: "AI & Deep Learning",
    emoji: "🤖",
    description: "LLMs, transformers, embeddings and generative AI",
    posts: [
      "llms", "transformers", "attention-mechanism",
      "embeddings-in-ai-search", "generative-ai-models", "word-embeddings",
      "nlp-tokenization", "computer-vision",
      "image-classification-vs-object-detection",
      "speech-recognition-pipeline", "reinforcement-learning",
      "api-for-ai", "ai-in-hacking",
    ]
  },
  {
    slug: "networking",
    title: "Networking",
    emoji: "🌐",
    description: "DNS, TCP, routing, and modern network architecture",
    posts: [
      "the-osi-model", "dns", "dnssec", "tcp-vs-udp", "ip-routing",
      "ipv6", "bgp", "quic", "vxlan", "sdn", "vpn", "https", "cors",
      "edge-computing", "cloud-networking",
    ]
  },
  {
    slug: "security",
    title: "Security",
    emoji: "🔐",
    description: "From SQL injection to zero trust architecture",
    posts: [
      "sql-injection", "social-engineering", "penetration-testing-tools",
      "securing-ssh", "zero-trust", "symmetric-vs-asymmetric-encryption",
      "hmac", "oauth2", "jwt-authentication", "ddos-attack",
      "the-dark-web", "iam",
    ]
  },
  {
    slug: "gpu-and-hardware",
    title: "GPU & Hardware",
    emoji: "⚡",
    description: "CUDA, TPUs, tensor cores and AI hardware",
    posts: [
      "gpu", "cuda-basics", "tensor-cores-vs-cuda-cores",
      "nvidia-gpu-architectures", "tpus",
      "gpus-and-tpus-vs-cpus-for-ai-training",
    ]
  },
  {
    slug: "backend-and-apis",
    title: "Backend & APIs",
    emoji: "🛠️",
    description: "REST, GraphQL, Django, FastAPI and more",
    posts: [
      "rest-api", "graphql", "django-rest-framework",
      "fastapi-backend-from-scratch", "cookies-vs-local-storage",
      "csr-vs-ssr", "progressive-web-apps", "javascript-event-loop",
      "modern-javascript-features", "the-dom", "virtual-dom",
      "how-browsers-render-html", "npm-and-yarn", "build-tools",
    ]
  },
  {
    slug: "devops-and-cloud",
    title: "DevOps & Cloud",
    emoji: "☁️",
    description: "Docker, Kubernetes, serverless and cloud infra",
    posts: [
      "docker", "kubernetes", "serverless-architecture",
      "infrastructure-as-code", "aws-s3", "evolution-of-cloud-computing",
      "finops", "database-scalability", "hadoop-and-redis-pipeline",
    ]
  },
  {
    slug: "git-and-tools",
    title: "Git & Developer Tools",
    emoji: "🔧",
    description: "Git workflows, GitHub, and developer productivity",
    posts: [
      "git-and-github-workflow", "branching-and-merging",
      "building-a-git-based-cms-in-1-week", "getting-started-with-rust",
    ]
  },
  {
    slug: "linux-and-systems",
    title: "Linux & Systems",
    emoji: "🐧",
    description: "Linux internals, services, and system administration",
    posts: [ "linux-startup-sequence", "managing-services" ]
  },
  {
    slug: "ml-projects",
    title: "ML Projects",
    emoji: "🚀",
    description: "Hands-on machine learning projects",
    posts: [ "predicting-housing-prices-with-ml" ]
  },
];
