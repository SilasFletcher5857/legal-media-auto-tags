import assert from "node:assert/strict";
import { Intake } from "./legal_media_service.js";

const parsed = Intake.parse({ matterType: "signed-document", filename: "order.png", file: "base64-image" });
assert.equal(parsed.matterType, "signed-document");
assert.throws(() => Intake.parse({ matterType: "other", filename: "x", file: "y" }));
console.log("request boundary test passed");
