// Remotion Studio entry — registers all compositions for `npm run studio`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Composition, registerRoot } from "remotion";
import { ReviewComposition } from "./templates/review/Composition";
import { sampleReviewManifest } from "./templates/review/sample-manifest";
import { AppIntroComposition } from "./templates/app-intro/Composition";
import { sampleAppIntroManifest } from "./templates/app-intro/sample-manifest";

/* eslint-disable @typescript-eslint/no-explicit-any */
const ReviewAny = ReviewComposition as any;
const reviewSampleAny = sampleReviewManifest as any;
const AppIntroAny = AppIntroComposition as any;
const appIntroSampleAny = sampleAppIntroManifest as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="review"
        component={ReviewAny}
        durationInFrames={sampleReviewManifest.total_frames}
        fps={sampleReviewManifest.fps}
        width={sampleReviewManifest.width}
        height={sampleReviewManifest.height}
        defaultProps={reviewSampleAny}
      />
      <Composition
        id="app-intro"
        component={AppIntroAny}
        durationInFrames={sampleAppIntroManifest.total_frames}
        fps={sampleAppIntroManifest.fps}
        width={sampleAppIntroManifest.width}
        height={sampleAppIntroManifest.height}
        defaultProps={appIntroSampleAny}
      />
    </>
  );
};

registerRoot(RemotionRoot);
