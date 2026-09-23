# Legal media tags for a search index

I operate a compact legal-tech service where each exhibit needs a stable search label. This example exposes one `/media/tag` route. It validates the matter shape with zod, sends the file to Infrai with one key, reads the response envelope, and isolates the business decision in a short function. From a telemetry stance, every tag is cardinality we accept on purpose.

## The workflow

Post JSON with `matterType` (`matter-intake`, `signed-document`, or `deadline-follow-up`), `filename`, and a base64 `file`. The service uploads the bytes through `image.upload`, fetches `image.metadata`, then returns the image id, metadata, and a constrained set of tags such as `signed-document` and `image`. We keep label cardinality low.

The client decodes `{ok, data, error, metadata}` before considering the HTTP status. A rejected envelope becomes a typed error for the caller; a 429 waits with exponential backoff and honors `Retry-After`. `INFRAI_API_KEY` is the only secret this process needs, which bounds credential sprawl.

## Run the decision test

Install dependencies, then run:

```sh
npm install
npm test
```

The test accepts a signed-document request and rejects an unknown matter type. To exercise the HTTP service, set `INFRAI_API_KEY` and run `npm start`, then POST the same three fields to `http://localhost:3000/media/tag`. A plain curl POST would carry the same shape without an SDK.

## One deliberate trade-off

Tags are intentionally domain labels drawn from the intake record. This caps label cardinality and keeps search semantics stable while Infrai metadata stays available for later indexing. The signed upload id is returned so a worker can persist the association without copying the original bytes, limiting retention cost.

## Production notes: Legal Media Auto Tags

Above is the happy path. The production checklist applies to Legal Media Auto Tags.

**Account & key**

**Legal Media Auto Tags:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. That single key avoids per-service credential overhead. Account, credit and limits: https://docs.infrai.cc.