# Keyword map — services and technologies

One primary query per page. Nothing gets written until it has a row here.

Without this, `/services/back-end`, `/services/custom-software` and
`/technologies/nodejs` all drift toward "backend development company", Google
picks one, and it is rarely the one you wanted. Three pages competing is worse
than one page ranking.

## The rule that separates the two taxonomies

| Taxonomy | Intent it serves | Query shape |
|---|---|---|
| **Services** | *I have a problem and need it solved* | "custom software development services", "ecommerce development company" |
| **Technologies** | *I have already chosen a stack and need people who know it* | "hire react developers", "laravel development agency" |

A buyer searching a technology is materially further down the funnel than one
searching a service. Service pages sell the outcome and link down to stacks;
technology pages sell the capability and link up to services. Never let a
technology page target a service query or the pair will cannibalise.

## Tier 1 — launch

Chosen for commercial priority and for being the work DevSaheb can actually
evidence. Eight pages, written to the substance bar, before anything else ships.

| Page | Primary query | Secondary | Guard |
|---|---|---|---|
| `/services/custom-software` | custom software development company | bespoke software development, custom software services | Owns "custom/bespoke". Never targets "web app" — that is web-development. |
| `/services/web-development` | web development services | web application development company | Owns the umbrella. front-end and back-end take the halves. |
| `/services/mobile-app` | mobile app development company | cross-platform app development | Owns platform-neutral. iOS/Android take named platforms. |
| `/services/cloud-application` | cloud application development | cloud-native application development | Owns *building for* cloud. DevOps owns *running* it. |
| `/services/devops` | devops services | ci/cd pipeline setup, infrastructure as code | Owns operate/deploy. Never "cloud development". |
| `/services/ai-development` | ai development company | ai integration services, llm integration | Owns applied/shipping AI. ML owns modelling. |
| `/services/saas` | saas development company | saas mvp development | Owns product/multi-tenant. custom-software owns one-off builds. |
| `/services/ecommerce` | ecommerce development company | headless commerce development | Owns storefronts. Never generic "web development". |

Technologies shipping alongside, same tier:

| Page | Primary query | Guard |
|---|---|---|
| `/technologies/reactjs` | hire react developers | Never "web development" — that is the service page. |
| `/technologies/nextjs` | next.js development company | Owns SSR/SSG framing. |
| `/technologies/typescript` | typescript development services | Support page; links up, low standalone volume. |
| `/technologies/nodejs` | node.js development company | Owns runtime. back-end service owns the outcome. |
| `/technologies/python` | python development company | Django takes the framework query. |
| `/technologies/flutter` | flutter app development company | Owns cross-platform *named*. mobile-app owns neutral. |
| `/technologies/react-native` | react native app development | Direct competitor term to Flutter; keep both, differentiate in copy. |
| `/technologies/aws` | aws development services | Owns AWS. cloud-application owns vendor-neutral. |

## Tier 2 — +30 to 60 days

| Page | Primary query |
|---|---|
| `/services/front-end` | front end development services |
| `/services/back-end` | backend development services |
| `/services/ios` | ios app development company |
| `/services/android` | android app development company |
| `/services/database` | database design and development services |
| `/services/qa` | software testing and qa services |
| `/services/cms` | cms development services |
| `/services/crm` | custom crm development |
| `/technologies/javascript` | javascript development company |
| `/technologies/laravel` | laravel development company |
| `/technologies/django` | django development company |
| `/technologies/kotlin` | kotlin app development |

## Tier 3 — as real content exists. No deadline.

| Page | Primary query |
|---|---|
| `/services/erp` | custom erp development |
| `/services/machine-learning` | machine learning development services |
| `/services/legacy-application-modernization` | legacy application modernization services |
| `/services/digital-transformation` | digital transformation consulting |
| `/technologies/vuejs` | vue.js development company |
| `/technologies/angular` | angular development company |
| `/technologies/webflow` | webflow development agency |
| `/technologies/php` | php development company |
| `/technologies/java` | java development company |
| `/technologies/spring-boot` | spring boot development services |
| `/technologies/golang` | golang development company |
| `/technologies/csharp` | c# development company |
| `/technologies/dotnet` | .net development company |
| `/technologies/azure` | azure development services |
| `/technologies/google-cloud` | google cloud development services |
| `/technologies/docker` | docker containerization services |
| `/technologies/ai` | ai development services |

## Known cannibalisation pairs

These will compete unless the copy actively separates them. Checked before each
tier ships.

| Pair | Separation |
|---|---|
| web-development / front-end / back-end | Umbrella vs. the two halves. Front/back pages must never use "web development" in H1 or title. |
| custom-software / saas | One-off build for one client vs. multi-tenant product. State which in the first paragraph. |
| mobile-app / ios / android / flutter / react-native | Neutral service → named platform → named framework. Three levels, three query shapes. |
| ai-development / machine-learning / technologies/ai | Shipping applied AI vs. training models vs. the capability page. The third is the weakest; consider folding into ai-development. |
| cloud-application / devops / aws / azure / google-cloud | Build for cloud vs. operate cloud vs. named vendor. |
| database / technologies (Postgres etc.) | Service owns design and modelling; no technology page currently competes. |

## Local intent

Bangladesh-qualified variants ("software development company in Bangladesh",
"hire developers in Dhaka") belong on the **home** and **contact** pages plus
the Google Business Profile — not appended to all 45. Repeating a location
modifier across every page is the doorway-page pattern in its most recognisable
form.

## The substance bar

No page ships without all six. This is what separates a legitimate programmatic
play from 45 templated pages that drag the domain down, since the helpful-content
systems assess quality **sitewide**, not per page.

1. 600–900 words genuinely written for this topic, not spun from a master template
2. At least one real case study or code example specific to *this* service or technology
3. A unique 3–5 question FAQ → `FAQPage` schema
4. Named engineers who actually work in it
5. An honest "when we would recommend something else" section
6. Cross-links to the paired taxonomy

Items 2 and 4 need facts only DevSaheb has. Pages ship when those exist, not
when the template renders.
