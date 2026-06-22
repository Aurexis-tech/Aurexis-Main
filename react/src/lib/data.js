// All data constants, verbatim from the baseline app.js. Pure data — no DOM,
// no behavior. Only change: `const` → `export const`.

/* ===== 1 profile + radar ===== */
export const QS=[
 {k:"energy",q:"What energizes you most?",sub:"",o:["Building things","Selling & growth","Systems & optimisation","Big-picture strategy","Solving hard problems","Creative & design"]},
 {k:"risk",q:"Your risk appetite?",sub:"",o:["Cautious","Steady","Balanced","Bold","All-in"]},
 {k:"domain",q:"Where do you want to start?",sub:"(business first)",o:["SaaS tools","AI & dev tools","AI agents & automation","Generative AI apps","LLM infra & MLOps","Computer vision","Voice & speech AI","Data & analytics","AI search & RAG","Cybersecurity","Fintech & payments","Healthtech","HR & recruiting","Marketing tech","Sales & CRM","Customer support","Legaltech","Proptech","Insurtech","Logistics & supply chain","Climate & energy","Robotics & hardware","IoT & devices","Web3 & blockchain","Gaming & interactive","Productivity & collaboration","No-code / low-code","Vertical SaaS","Media & content","E-commerce & DTC","Marketplaces","Creator economy","Education & courses","Local services"]},
 {k:"style",q:"How do you decide?",sub:"",o:["Fast & iterative","Data-first","Intuition-led","Customer-led","Methodical"]},
 {k:"time",q:"Time you can give?",sub:"",o:["Weekends only","Side hustle","Part-time","Full-time","Full-time + team"]},
];
export const NOUN={"Building things":"Builder","Selling & growth":"Grower","Systems & optimisation":"Operator","Big-picture strategy":"Visionary","Solving hard problems":"Problem-Solver","Creative & design":"Maker"};
export const TRAITS=["Build","Grow","System","Vision","Create"];

/* ---- procedural opportunity generator (domains without a bespoke set) ---- */
export const DKIT={
 "AI agents & automation":["Agent","multi-step work for teams"],"Generative AI apps":["Content","on-brand content & assets"],
 "LLM infra & MLOps":["Model","shipping & monitoring models"],"Computer vision":["Vision","image & video understanding"],
 "Voice & speech AI":["Voice","calls & voice workflows"],"Data & analytics":["Data","turning data into decisions"],
 "AI search & RAG":["Search","answers from your own knowledge"],"Cybersecurity":["Threat","detecting & stopping attacks"],
 "Fintech & payments":["Payments","moving & managing money"],"Healthtech":["Care","patient & clinic workflows"],
 "HR & recruiting":["Talent","hiring & people ops"],"Marketing tech":["Campaign","marketing execution"],
 "Sales & CRM":["Pipeline","winning & tracking deals"],"Customer support":["Support","customer conversations"],
 "Legaltech":["Contract","legal & contract work"],"Proptech":["Property","real-estate workflows"],
 "Insurtech":["Policy","insurance workflows"],"Logistics & supply chain":["Logistics","moving goods & inventory"],
 "Climate & energy":["Energy","energy use & emissions"],"Robotics & hardware":["Robotics","physical automation"],
 "IoT & devices":["Device","connected devices & fleets"],"Web3 & blockchain":["Onchain","onchain apps & wallets"],
 "Gaming & interactive":["Game","games & interactive worlds"],"Productivity & collaboration":["Workflow","team productivity"],
 "No-code / low-code":["Builder","building apps without code"],"Vertical SaaS":["Ops","an underserved industry's operations"],
 "Media & content":["Media","media production & distribution"]
};
export const FOCUS_KW={automation:["automat","autopilot","workflow","flow"],data:["data","model","predict","insight","analyt","radar"],
 reliability:["monitor","uptime","observ","reliab","alert","trust"],efficiency:["cost","efficien","optim"],scale:["scale","platform","orchestrat"],
 brand:["brand","content","review","ugc","social","story"],distribution:["reach","seo","market","channel","campaign"],
 customer:["support","customer","onboard","care","community"],novelty:["copilot","agent","build"],conversion:["convert","sales","pipeline","deal","bundle","offer","quote"],
 workflow:["workflow","app","schedul","ops"],audience:["community","creator","audience","content"]};

/* ---- adaptive, self-generated follow-up engine ---- */
export const FQ_A={
 "Building things":{id:"a",q:"You love building. What pulls you most right now?",opts:[{l:"A 0-to-1 product",f:"novelty"},{l:"A tool for your own itch",f:"founder-fit"},{l:"Rebuilding something done badly",f:"disruption"}]},
 "Selling & growth":{id:"a",q:"You're energised by growth. Where's your edge?",opts:[{l:"Finding demand others miss",f:"distribution"},{l:"Converting interest to revenue",f:"conversion"},{l:"Building a trusted brand",f:"brand"}]},
 "Systems & optimisation":{id:"a",q:"You think in systems. What do you optimise first?",opts:[{l:"Cost & efficiency",f:"efficiency"},{l:"Reliability & uptime",f:"reliability"},{l:"Throughput & scale",f:"scale"}]},
 "Big-picture strategy":{id:"a",q:"You see the big picture. What's the bet?",opts:[{l:"A category about to explode",f:"timing"},{l:"A platform others build on",f:"scale"},{l:"A wedge into a big market",f:"distribution"}]},
 "Solving hard problems":{id:"a",q:"Hard problems pull you. Which kind?",opts:[{l:"Technically deep ones",f:"depth"},{l:"Messy, unstructured ones",f:"signal"},{l:"Ones with no playbook",f:"novelty"}]},
 "Creative & design":{id:"a",q:"You're a maker. What's your medium?",opts:[{l:"Beautifully crafted products",f:"craft"},{l:"Content & story",f:"brand"},{l:"Experiences people feel",f:"craft"}]},
};
export const FB={
 bold:{id:"b",q:"You move boldly. When a bet stalls, you…",opts:[{l:"Double down faster",f:"momentum"},{l:"Pivot hard",f:"experiment"},{l:"Cut it, move on",f:"decisive"}]},
 careful:{id:"b",q:"You move deliberately. What lets you commit?",opts:[{l:"Proof it works",f:"evidence"},{l:"A clear plan",f:"plan"},{l:"Low downside",f:"reliability"}]},
 data:{id:"b",q:"You trust data. When data is thin, you…",opts:[{l:"Run a quick experiment",f:"experiment"},{l:"Find a proxy signal",f:"signal"},{l:"Wait for more",f:"evidence"}]},
 intuition:{id:"b",q:"You trust instinct. How do you check it?",opts:[{l:"Talk to customers",f:"customer"},{l:"Ship and watch",f:"experiment"},{l:"Sleep on it",f:"plan"}]},
 customer:{id:"b",q:"You start from the customer. Who first?",opts:[{l:"The most underserved",f:"distribution"},{l:"The most profitable",f:"conversion"},{l:"The easiest to reach",f:"reach"}]},
 generic:{id:"b",q:"How do you like to make the call?",opts:[{l:"Quickly, adjust later",f:"momentum"},{l:"Carefully, once",f:"plan"},{l:"With others' input",f:"customer"}]},
};
export const FQ_C={
 "SaaS tools":{id:"c",q:"In SaaS, what's your moat?",opts:[{l:"A workflow they can't leave",f:"workflow"},{l:"Data that compounds",f:"data"},{l:"Speed of shipping",f:"experiment"}]},
 "AI & dev tools":{id:"c",q:"For developers, what wins?",opts:[{l:"Best developer experience",f:"craft"},{l:"Deepest capability",f:"depth"},{l:"Easiest to adopt",f:"reach"}]},
 "AI agents & automation":{id:"c",q:"For agents, what matters most?",opts:[{l:"Reliability",f:"reliability"},{l:"Autonomy",f:"automation"},{l:"Safety & control",f:"reliability"}]},
 "Generative AI apps":{id:"c",q:"For a GenAI app, your focus?",opts:[{l:"Output quality",f:"craft"},{l:"Speed & cost",f:"efficiency"},{l:"A delightful UX",f:"craft"}]},
 "Cybersecurity":{id:"c",q:"In security, your angle?",opts:[{l:"Prevent attacks",f:"reliability"},{l:"Detect & respond",f:"signal"},{l:"Simplify compliance",f:"plan"}]},
 "Fintech & payments":{id:"c",q:"In fintech, your wedge?",opts:[{l:"Cheaper money movement",f:"efficiency"},{l:"Simpler finance UX",f:"craft"},{l:"Smarter risk & credit",f:"data"}]},
 "Healthtech":{id:"c",q:"In health, who do you serve first?",opts:[{l:"Patients",f:"customer"},{l:"Clinicians",f:"workflow"},{l:"Cut admin cost",f:"efficiency"}]},
 "Creator economy":{id:"c",q:"For creators, what do you own?",opts:[{l:"The audience",f:"audience"},{l:"The monetisation",f:"conversion"},{l:"The production",f:"automation"}]},
 "E-commerce & DTC":{id:"c",q:"In commerce, your lever?",opts:[{l:"Higher conversion",f:"conversion"},{l:"Repeat & retention",f:"customer"},{l:"Lower cost per order",f:"efficiency"}]},
 "Marketplaces":{id:"c",q:"For a marketplace, the hard part?",opts:[{l:"Liquidity",f:"distribution"},{l:"Trust & safety",f:"reliability"},{l:"Unit economics",f:"conversion"}]},
 "Education & courses":{id:"c",q:"In education, what drives it?",opts:[{l:"Outcomes that work",f:"evidence"},{l:"Engagement",f:"craft"},{l:"Reach & access",f:"reach"}]},
 "Local services":{id:"c",q:"For local services, your edge?",opts:[{l:"Win more jobs",f:"conversion"},{l:"Save owner time",f:"automation"},{l:"Reputation",f:"brand"}]},
 "Data & analytics":{id:"c",q:"With data, the value is?",opts:[{l:"Better decisions",f:"data"},{l:"Automation",f:"automation"},{l:"Speed to insight",f:"signal"}]},
 "Sales & CRM":{id:"c",q:"In sales, what do you fix?",opts:[{l:"Pipeline visibility",f:"data"},{l:"Conversion",f:"conversion"},{l:"Rep productivity",f:"automation"}]},
 "Customer support":{id:"c",q:"In support, your goal?",opts:[{l:"Faster resolution",f:"efficiency"},{l:"Self-serve deflection",f:"automation"},{l:"Happier customers",f:"customer"}]},
 "Marketing tech":{id:"c",q:"In marketing, your edge?",opts:[{l:"More reach",f:"distribution"},{l:"Better targeting",f:"data"},{l:"Faster content",f:"automation"}]},
 "HR & recruiting":{id:"c",q:"In hiring, what matters?",opts:[{l:"Better candidates",f:"data"},{l:"Faster process",f:"automation"},{l:"Great experience",f:"craft"}]},
 "Legaltech":{id:"c",q:"In legal, your wedge?",opts:[{l:"Speed",f:"automation"},{l:"Accuracy",f:"evidence"},{l:"Lower cost",f:"efficiency"}]},
};
export const FOCUS_ADJ={novelty:"a builder of new things","founder-fit":"someone scratching your own itch",disruption:"a disruptor",distribution:"a distribution thinker",conversion:"conversion-focused",brand:"a brand-builder",efficiency:"an efficiency optimiser",reliability:"reliability-minded",scale:"a scaler",timing:"a timing player",depth:"technically deep",signal:"signal-seeking",craft:"craft-driven",momentum:"high-momentum",experiment:"experiment-led",decisive:"decisive",evidence:"evidence-led",plan:"a planner",customer:"customer-obsessed",reach:"reach-focused",workflow:"workflow-minded",data:"data-driven",audience:"audience-first",automation:"automation-leaning",handson:"hands-on",lighttouch:"automation-leaning"};

/* ===== 2 opportunities ===== */
export const LIB={
 "SaaS tools":[
  {t:"Inbox Triage Copilot",g:"AI that drafts, sorts & schedules a founder's email.",b:["AI agent","Web app","Email integrations","Billing"],bias:{energy:"Building things",style:"Fast & iterative"}},
  {t:"Churn Radar",g:"Predicts which accounts will churn and auto-runs save-playbooks.",b:["Data pipeline","Prediction model","Dashboard","Alert automation"],bias:{style:"Data-first",energy:"Systems & optimisation"}},
  {t:"Onboarding Autopilot",g:"Interactive self-serve onboarding that lifts activation.",b:["Embed SDK","No-code flow editor","Analytics","Web app"],bias:{energy:"Selling & growth"}},
 ],
 "Local services":[
  {t:"BookFlow",g:"Booking + smart reminders for clinics, salons & studios.",b:["Scheduling app","SMS automation","Payments","Owner dashboard"],bias:{energy:"Building things"}},
  {t:"ReviewLift",g:"Automated review collection + reputation for local businesses.",b:["Automation engine","Embed widgets","Dashboard","Integrations"],bias:{energy:"Selling & growth",style:"Fast & iterative"}},
  {t:"QuoteBot",g:"Instant, accurate quotes for trades and contractors.",b:["Estimator agent","Lead site","Mini-CRM","Workflows"],bias:{style:"Data-first"}},
 ],
 "Creator economy":[
  {t:"Repurpose Engine",g:"Turn one long video into clips for every platform.",b:["Media pipeline","AI agents","Scheduler","Web app"],bias:{energy:"Building things",style:"Fast & iterative"}},
  {t:"Membership OS",g:"Paid community + gated content + recurring revenue.",b:["Community app","Payments","Content automation","Dashboard"],bias:{energy:"Selling & growth"}},
  {t:"Sponsor Match",g:"Matches creators with brands and handles deal flow.",b:["Marketplace","Matching agent","Contract workflows","Payments"],bias:{energy:"Big-picture strategy",risk:"Bold"}},
 ],
 "Marketplaces":[
  {t:"NicheMarket",g:"A vertical marketplace builder for an underserved category.",b:["Marketplace platform","Payments + escrow","Trust/ratings","Ops automation"],bias:{energy:"Big-picture strategy",risk:"Bold"}},
  {t:"Local Supply Connect",g:"Connects restaurants with nearby suppliers; auto-reordering.",b:["Ordering app","Logistics automation","Catalog","Dashboard"],bias:{style:"Data-first"}},
  {t:"SkillSwap",g:"A services marketplace matching skills to local demand.",b:["Matching engine","Scheduling","Payments","Reviews"],bias:{energy:"Selling & growth"}},
 ],
 "AI & dev tools":[
  {t:"Eval Copilot",g:"Automated testing & evals for teams shipping LLM features.",b:["Eval harness","Web app","CI integration","Dashboard"],bias:{style:"Data-first",energy:"Solving hard problems"}},
  {t:"Agent Monitor",g:"Observability & guardrails for production AI agents.",b:["Telemetry pipeline","Agent SDK","Alerting","Dashboard"],bias:{energy:"Systems & optimisation",style:"Methodical"}},
  {t:"Docs-to-Answers",g:"Turns a company's docs into an AI assistant devs can ask.",b:["Ingestion pipeline","RAG service","Embed widget","Analytics"],bias:{energy:"Building things",style:"Fast & iterative"}},
 ],
 "E-commerce & DTC":[
  {t:"Bundle Optimizer",g:"AI that builds high-margin product bundles & offers.",b:["Recommendation model","Store integration","A/B engine","Dashboard"],bias:{style:"Data-first",energy:"Selling & growth"}},
  {t:"Win-Back Engine",g:"Automated flows that revive lapsed customers.",b:["Segmentation","Email/SMS automation","Store integration","Dashboard"],bias:{energy:"Selling & growth",style:"Customer-led"}},
  {t:"Review-to-UGC",g:"Turns reviews into shoppable social content automatically.",b:["Media pipeline","AI agents","Scheduler","Store integration"],bias:{energy:"Creative & design",style:"Fast & iterative"}},
 ],
 "Education & courses":[
  {t:"Cohort OS",g:"Run live cohort courses — enrolment, content, community.",b:["Course app","Payments","Community","Automation"],bias:{energy:"Selling & growth"}},
  {t:"Quiz-to-Course",g:"Turns expertise into an interactive course with assessments.",b:["Authoring tool","Quiz engine","Web app","Analytics"],bias:{energy:"Creative & design",style:"Methodical"}},
  {t:"Coach Copilot",g:"An AI assistant that scales a coach's 1:1 guidance.",b:["AI agent","Scheduling","Payments","Dashboard"],bias:{energy:"Solving hard problems",style:"Intuition-led"}},
 ],
};
export const MKT=["$1.2B","$3.4B","$680M","$5.1B","$920M","$2.7B"];

/* ===== 3 forge ===== */
export const FPROD=[["S","Scout","Finds opportunities before others see them"],["A","Architect","Transforms the opportunity into a blueprint"],
 ["C","Creator","Builds everything the blueprint requires"],["O","Operator","Monitors, optimises, scales & keeps it reliable"],["E","Evolver","Asks daily: how does this get better?"]];
export const VERS=[["V1","Discover"],["V2","Blueprint"],["V3","Build"],["V4","Create & run"],["V5","Launch businesses"],["V6","Many ventures"],["V7","Worldwide"]];

/* ===== 4 sentinel ===== */
export const CHECKS=[["Row-level security","Tenant isolation enforced by the database"],["Authentication & SSO","OAuth + session integrity verified"],
 ["Input validation","Every endpoint sanitised against injection"],["Secrets management","Keys in vault · none in client/repo"],
 ["Deployment security","Hardened build · least-privilege roles"],["Rate limiting & abuse","Throttling + anomaly detection live"],
 ["Dependency scan","0 critical vulnerabilities in supply chain"],["Access control","Read/write boundaries proven, not assumed"]];
export const OVERSIGHT=[["a","step 1/7","blueprint integrity confirmed"],["a","step 3/7","data layer matches spec · RLS on"],
 ["a","step 5/7","integrations authenticated correctly"],["a","step 7/7","deploy reproducible · rollback ready"],["t","update","you were notified at each checkpoint"]];

/* ===== 6 grow ===== */
export const GEO=[["L","Lens","Reality perception — how do AI systems see you today?",24],["P","Presence","Authority construction — how do we become visible?",40],
 ["S","Signal","Knowledge distribution — what should AI know about us?",54],["R","Reach","Visibility expansion — where should presence exist?",62],
 ["U","Pulse","Continuous monitoring — are we becoming more discoverable?",71]];
export const CHN=["Google","ChatGPT","Claude","Gemini","Perplexity","Communities"];
