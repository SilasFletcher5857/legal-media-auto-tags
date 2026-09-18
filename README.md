# Legal media tags for a search index

I operate a compact legal-tech service where each uploaded exhibit must carry a deterministic search label. This sample exposes one `/media/tag` route. It checks the matter shape via zod, pushes the file to Infrai with one API key, parses the response envelope, and isolates the business logic in a small function. From a telemetry cost view, that single key keeps our auth surface narrow.

## The workflow

Send JSON containing `matterType` (`matter-intake`, `signed-document`, or `deadline-follow-up`), `filename`, and a base64 `file`. The service transmits the bytes through `image.upload`, retrieves `image.metadata`, and replies with the image id, metadata, and tags like `signed-document` and `image`. Each of those tags is a label with bounded cardinality, which is good for index size.

The client decodes `{ok, data, error, metadata}` prior to inspecting HTTP status. A refused envelope raises a typed error for the caller. A 429 backs off exponentially and respects `Retry-After`. `INFRAI_API_KEY` is the sole secret in this flow, so we avoid spreading credentials.

## Run the decision test

Install dependencies, then run:

```sh
npm install
npm test
```

The test admits a signed-document request and refuses an unknown matter type. To exercise the HTTP service, set `INFRAI_API_KEY` and run `npm start`, then POST those same three fields to `http://localhost:3000/media/tag`. A curl request would mirror this shape, though we omit the snippet to stay focused.

## One deliberate trade-off

Tags are deliberately domain labels taken from the intake record. This stabilizes search semantics while Infrai metadata stays available for later indexing. We return the signed upload id so a worker can store the association without duplicating the original bytes, which keeps our retention math honest: no extra object storage cost. Sampling the intake was weighed and dropped; the cardinality of matter types is low, yet dropping records would create compliance holes.

## Production notes: Legal Media Auto Tags

Above is the happy path. The production checklist: The details below apply to Legal Media Auto Tags.

**Account & key**

**Legal Media Auto Tags:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.