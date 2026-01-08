# Environmental Trade-off Calculator

This project is a small full-stack web app to estimate **environmental tree compensation** required under São Paulo state regulations (Resolução SEMIL nº 02/2024).

The **frontend** is a simple HTML/CSS/JavaScript single page application with tabs for each workflow. It calls the Flask API via `fetch` and renders tables with detailed results and totals.

The **backend** is a Flask API (with Swagger/OpenAPI docs) that reads compensation rules from CSV files into a SQLite database. It currently supports four main operations:

- **Isolated trees**  
  Given the quantity of trees, group (*native* / *exotic*), municipality, and whether the species is endangered, the API returns:
  - compensation per tree
  - compensation per item
  - total compensation for the entire batch

- **Forest patches / area (m²)**  
  Given municipality, successional stage, and patch area, the API looks up a compensation factor (per m²) and computes the total compensation for the patch or set of patches.

- **Permanent Preservation Area (PPA)**  
  Similar to patches, but using a dedicated rules table for PPA compensation.

- **Species conservation status**  
  Query by family and/or scientific name and retrieve an IUCN-style status (`EW`, `CR`, `EN`, `VU`, etc.).

In all cases, compensation is calculated automatically based on the **municipality-specific rules** defined in SEMIL 02/2024.

All trade-off rules used here were extracted from the official document  
**“Resolução SEMIL nº 02/2024” (Annex II, pages 30–34)**.


---
## How to run

You need to create a virtual env and install the libraries listed on `requirements.txt`

```
(env)$ pip install -r requirements.txt
```
In order to run the API, inside your virtual env:

```
(env)$cd mvp_fullstack

(env)$ python -m flask --app app run --host 0.0.0.0 --port 5002

```
In sequence, you can use postman or another tool to make requests for the API, examples of possible requests can be found at:
http://127.0.0.1:5002/apidocs/#/

Otherwise, you can open the index.html file contained into the mvp_fullstack_front repository in your browser.

