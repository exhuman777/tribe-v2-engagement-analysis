import React from 'react';
import {Composition} from 'remotion';
import {EngagementVideo, defaultProps} from './EngagementVideo';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="EngagementAnalysis"
				component={EngagementVideo}
				durationInFrames={420}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={defaultProps}
			/>
		</>
	);
};
