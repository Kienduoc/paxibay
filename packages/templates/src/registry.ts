import type { TemplateId, RenderManifest } from "@paxibay/core";
import { ReviewComposition } from "./templates/review/Composition";
import { AppIntroComposition } from "./templates/app-intro/Composition";

export type TemplateComponent = React.FC<RenderManifest>;

/**
 * Maps template slug → React component.
 * Web app uses this to embed <Player> with the right composition.
 * Render engine uses this to look up which composition to bundle.
 */
export const TEMPLATE_REGISTRY: Partial<Record<TemplateId, TemplateComponent>> = {
  review: ReviewComposition,
  "app-intro": AppIntroComposition,
  // TODO: product-ad, report, news, tutorial
};

export function getComposition(id: TemplateId): TemplateComponent | undefined {
  return TEMPLATE_REGISTRY[id];
}
