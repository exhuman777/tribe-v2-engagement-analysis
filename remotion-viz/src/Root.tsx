import React from 'react';
import {Composition} from 'remotion';
import {EngagementVideo, defaultProps} from './EngagementVideo';
import {TemplateShowcase, templateDefaultProps} from './TemplateShowcase';

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
			<Composition
				id="TemplateShowcase"
				component={TemplateShowcase}
				durationInFrames={360}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={templateDefaultProps}
			/>
		</>
	);
};
