---
title: "Who holds the AI off switch"
lang: "en"
kind: "reflection"
date: "2026-06-13"
excerpt: "On 9 June Anthropic shipped Fable 5. On 12 June the US government ordered foreign access cut, and the model went dark. A short note on what that says about Europe's dependency, and what is actually left when the tap closes."
key: "ai-kill-switch"
slug: "ai-kill-switch"
---
You got the most powerful public AI model on Tuesday. By Friday evening someone in Washington had switched it off. Nobody asked you.

On 9 June Anthropic released Claude Fable 5, its most powerful public model. Three days later, on Friday 12 June at 5:21pm Eastern, the company received a letter from the US Commerce Department. The order was blunt: cut off access to Fable 5 and Mythos 5 for all foreign nationals. Anthropic decided it had no clean way to separate foreigners from everyone else, so it disabled both models worldwide. For all users. AWS pulled them in every region.

I take one lesson from this. Access to the strongest AI models is not something you buy and own. It is a privilege on someone else's server, behind someone else's switch. On Friday that switch was used.

## What happened, in order

In April Anthropic introduced Mythos. It described the model as dangerous enough in cybersecurity that it could not be released to the public. It went only to a narrow group of partners and to a collaboration with the US government called Glasswing. The company's argument: this model finds and exploits software vulnerabilities better than almost any human.

On 9 June came Fable 5. The same underlying engine as Mythos, wrapped in safeguards. In high-risk domains, meaning cyber, biology, chemistry and model distillation, Fable 5 is built to block the answer and fall back to the weaker Opus 4.8. Anthropic claimed it was the best public model on nearly every benchmark. Price: 10 dollars per million input tokens and 50 per million output. Mythos 5 is the version with the safeguards loosened, available only to Glasswing partners.

Then Friday arrived. Citing national security, the government ordered access blocked for every foreign national, inside the US and outside it, including Anthropic's own employees without US citizenship. The reason the company was given: someone had found a way to bypass Fable 5's safeguards that, in one specific case, unlocked the cyber capabilities of Mythos. No details of the concern were shared.

Anthropic's response was sharp. The company said it disagreed that a narrow jailbreak should be grounds for recalling a model already deployed to hundreds of millions of users. It added a line worth remembering: if this standard were applied across the industry, it would halt the deployment of all new models from all frontier providers. Opus 4.8 and weaker models stayed on. Only the very top went dark.

## Why this was not an ordinary outage

This was not a server bug or a technical fault. It was an administrative decision, taken in an afternoon, with no reasoning handed to the company. It worked like export control, the same logic applied to weapons and dual-use technology.

One cybersecurity researcher put it well: if you describe your product as a munition in every press release, eventually a government takes you at your word. Anthropic spent years building a story about a model as dangerous as a cyber weapon. The state took that story literally and reached for the switch.

For a user in the US the block was collateral damage, and probably temporary. For us in Europe the mechanism matters more. Your access to the strongest technology depends on a foreign government's national security call. That call can be made in one afternoon. And it does not have to come with an explanation.

## Where Europe actually stands

There is no point pretending here. By estimates cited in June, Europe controls about 5 percent of the world's AI compute. The US holds around 80 percent. European demand is split across 27 markets, each acting largely on its own. Bruegel states the problem bluntly: the constraint is not talent or ideas, the constraint is access to compute and capital.

The spending gap fills in the rest. In 2026 US tech firms plan to put more than 700 billion dollars into AI infrastructure. Amazon alone is running investment on the order of 200 billion. Europe's plans, including the InvestAI programme and the idea of AI gigafactories, are counted in the tens of billions and spread over years. A different budget league.

Europe does hold real cards. ASML is the only company in the world that makes EUV lithography machines, without which no advanced chip exists. There is the IMEC research centre. There are people. The trouble is that the cards sit on the hardware side, not on the side of large models and the compute to train them. Mistral, the French pride, trained its models on Microsoft's cloud. The scale of European labs barely registers next to the American and Chinese ones.

Politicians reacted within hours. Jordan Bardella said that countries which do not build their own models will grow ever more dependent on the choices of other powers, and called on France to accelerate its support for Mistral. British MP Tom Tugendhat put it more briefly: sovereignty today is more about code than cannons.

## What is left when they close the tap

Let us be concrete about what a European actually has if the frontier gets cut off for good.

First, what survived Friday: older Anthropic models such as Opus 4.8, plus GPT and Gemini. They work, but it is the same switch, just not yet thrown. They sit on American servers and under American export law.

Then the real plan B, the European one. Mistral in France is closest to the frontier. Valued at around 20 billion euros, in June it was raising another 3 billion. It ships some of its models with open weights, so you can download and run them yourself. The weaker side: it is still chasing the leaders and itself relies on American cloud and American chips.

Bielik in Poland is a different way of thinking. It is built by the SpeakLeash foundation with compute from Cyfronet AGH, as an open, non-profit project. Version three, from 1 January 2026, has 11 billion parameters, open weights and open training data, runs locally, and is built for the Polish language and Polish context.

And here honesty is required. An 11-billion model running locally and a 20-billion-euro lab are not the equal of Fable 5. This is not parity with the frontier. It is a sovereignty floor, not a ceiling of capability. But these tools have one property the frontier lacks: nobody in Washington can put them out with a single letter. A weaker model you control can be worth more than a stronger one someone else can take away.

## What this text does not claim

Nobody cut Europe off from AI overnight. Today Opus 4.8, GPT, Gemini, Mistral and Bielik all run. Only the very top went dark, Fable 5 and Mythos 5, and for everyone, as a side effect of a rule about foreign nationals. It may have been a one-off security action rather than a standing ban on the EU. But the precedent and the mechanism stopped being theory. They were shown in practice.

The dark scenario for Europe is not settled either. The line about no spectacular growth ahead describes the current course, not a verdict. ASML, IMEC and the people are real. The bottlenecks are compute, capital and the split across 27 markets. That can be closed, only slowly. Airbus needed two decades to catch Boeing.

## What I do about it on my side

The operating conclusion is boring, which is why it is good. A frontier model from an American provider I treat as rented compute behind someone else's switch. Underneath it I keep a cheaper, local or open model that keeps running when the tap is closed. I build so that swapping the model does not kill the product and so that no single provider becomes the only point of failure.

The switch exists. On Friday it was used. The question is not whether someone has it. The question is whose hand is on it. For now, not ours.

---

Sources: [Anthropic announcement](https://www.anthropic.com/news/claude-fable-5-mythos-5), [the shutdown and the company's response (Fortune)](https://fortune.com/2026/06/13/anthropic-disables-fable-mythos-export-controls-national-security-threat/), [European reactions (Euronews)](https://www.euronews.com/2026/06/13/why-anthropic-is-halting-access-to-its-fable-5-and-mythos-5-ai-models), [Europe and the compute gap (Semafor)](https://www.semafor.com/article/06/11/2026/europe-at-risk-of-ai-driven-irrelevance), [Mistral raising capital (TechCrunch)](https://techcrunch.com/2026/06/12/mistral-is-rumored-to-be-raising-e3b-at-e20-valuation/), [Bielik (SpeakLeash)](https://bielik.ai/).
