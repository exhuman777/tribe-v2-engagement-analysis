import React from 'react';
import {
	AbsoluteFill,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	spring,
	random,
} from 'remotion';
import {
	TransitionSeries,
	springTiming,
	linearTiming,
} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {wipe} from '@remotion/transitions/wipe';

// ─── Constants ────────────────────────────────────────────────────────────────

const W = 1080;
const H = 1920;
const PURPLE = '#7c3aed';
const CYAN = '#06b6d4';
const GREEN = '#10b981';
const ORANGE = '#f97316';
const PINK = '#f472b6';

// ─── Reusable animated primitives ────────────────────────────────────────────

/** Ken Burns slow zoom on a gradient background */
const KenBurns: React.FC<{from: string; to: string; zoomDir?: 'in' | 'out'}> = ({
	from,
	to,
	zoomDir = 'in',
}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
		extrapolateRight: 'clamp',
	});
	const scale = zoomDir === 'in'
		? interpolate(progress, [0, 1], [1, 1.07])
		: interpolate(progress, [0, 1], [1.07, 1]);
	return (
		<AbsoluteFill
			style={{
				background: `linear-gradient(155deg, ${from}, ${to})`,
				transform: `scale(${scale})`,
			}}
		/>
	);
};

/** Gradient dark vignette overlay */
const Vignette: React.FC<{strength?: number}> = ({strength = 0.6}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${strength}) 100%)`,
		}}
	/>
);

/** Bottom scrim so lower-third text always reads */
const BottomScrim: React.FC = () => (
	<AbsoluteFill
		style={{
			background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 45%)',
		}}
	/>
);

/** Floating particles — positions driven by random() seeds, never Math.random() */
const Particles: React.FC<{count?: number; color?: string}> = ({
	count = 40,
	color = 'white',
}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
			{Array.from({length: count}, (_, i) => {
				const x = random(`px${i}`) * W;
				const baseY = random(`py${i}`) * H;
				const speed = random(`pspd${i}`) * 0.5 + 0.15;
				const size = random(`psz${i}`) * 5 + 1.5;
				const phase = random(`pph${i}`) * 6.28;
				const y = ((baseY - frame * speed) % H + H) % H;
				const opacity = 0.06 + Math.sin(frame * 0.035 + phase) * 0.04;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x,
							top: y,
							width: size,
							height: size,
							borderRadius: '50%',
							background: color,
							opacity,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

/** Accent bar that wipes in from the left using spring */
const AccentBar: React.FC<{color: string; y: number; h?: number; delay?: number}> = ({
	color,
	y,
	h = 7,
	delay = 0,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const sp = spring({fps, frame: Math.max(0, frame - delay), config: {damping: 200}});
	const w = sp * W;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: y,
				width: w,
				height: h,
				background: color,
				borderRadius: '0 4px 4px 0',
			}}
		/>
	);
};

/** Badge / pill label that scales in with spring */
const Badge: React.FC<{
	text: string;
	color: string;
	x: number;
	y: number;
	delay?: number;
}> = ({text, color, x, y, delay = 0}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const sp = spring({fps, frame: Math.max(0, frame - delay), config: {damping: 180}});
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				padding: '14px 32px',
				borderRadius: 999,
				background: color,
				color: 'white',
				fontSize: 30,
				fontWeight: 800,
				fontFamily: 'sans-serif',
				letterSpacing: 2,
				transform: `scale(${sp})`,
				opacity: sp,
				transformOrigin: 'left center',
			}}
		>
			{text}
		</div>
	);
};

/** Word-by-word staggered reveal using interpolate + spring per word */
const WordReveal: React.FC<{
	text: string;
	style: React.CSSProperties;
	startFrame?: number;
	stagger?: number;
}> = ({text, style, startFrame = 0, stagger = 5}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const words = text.split(' ');
	return (
		<div style={{...style, display: 'flex', flexWrap: 'wrap', gap: '0.22em'}}>
			{words.map((word, i) => {
				const wf = Math.max(0, frame - startFrame - i * stagger);
				const sp = spring({fps, frame: wf, config: {damping: 160}});
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							transform: `translateY(${interpolate(sp, [0, 1], [36, 0])}px)`,
							opacity: sp,
						}}
					>
						{word}
					</span>
				);
			})}
		</div>
	);
};

/** Animated progress bar that fills over durationF frames */
const ProgressBar: React.FC<{
	color: string;
	y: number;
	startFrame?: number;
	durationF?: number;
}> = ({color, y, startFrame = 0, durationF = 80}) => {
	const frame = useCurrentFrame();
	const progress = interpolate(
		frame,
		[startFrame, startFrame + durationF],
		[0, 1],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
	);
	return (
		<div
			style={{
				position: 'absolute',
				left: 60,
				top: y,
				width: W - 120,
				height: 8,
				background: 'rgba(255,255,255,0.13)',
				borderRadius: 999,
			}}
		>
			<div
				style={{
					width: `${progress * 100}%`,
					height: '100%',
					background: `linear-gradient(90deg, ${color}, white)`,
					borderRadius: 999,
					boxShadow: `0 0 18px ${color}`,
				}}
			/>
		</div>
	);
};

/** Count-up number animating from 0 to target */
const CountUp: React.FC<{
	to: number;
	suffix?: string;
	style: React.CSSProperties;
	startFrame?: number;
	durationF?: number;
}> = ({to, suffix = '', style, startFrame = 0, durationF = 50}) => {
	const frame = useCurrentFrame();
	const raw = interpolate(frame, [startFrame, startFrame + durationF], [0, to], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const display = Number.isInteger(to) ? Math.round(raw) : raw.toFixed(1);
	return (
		<div style={style}>
			{display}
			{suffix}
		</div>
	);
};

// ─── Scene 1 — HOOK ───────────────────────────────────────────────────────────
// Effects: Ken Burns zoom · Particles · Word reveal · AccentBar wipe · Badge spring · ProgressBar

const SceneHook: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// Subtitle slides up with spring after headline
	const subSp = spring({fps, frame: Math.max(0, frame - 32), config: {damping: 150}});

	return (
		<AbsoluteFill>
			<KenBurns from="#120330" to="#0b1a4a" zoomDir="in" />
			<Particles count={50} color="#a78bfa" />
			<Vignette />
			<BottomScrim />

			{/* Top badge — spring scale */}
			<Badge text="⚡  BREAKING" color={PURPLE} x={60} y={130} delay={4} />

			{/* Headline — word by word */}
			<div style={{position: 'absolute', left: 60, top: 330, width: W - 120}}>
				<WordReveal
					text="This Changes Everything You Know"
					startFrame={8}
					stagger={5}
					style={{
						fontSize: 100,
						fontWeight: 900,
						fontFamily: 'sans-serif',
						color: 'white',
						lineHeight: 1.04,
						letterSpacing: -2,
					}}
				/>
			</div>

			{/* Cyan accent wipe */}
			<AccentBar color={CYAN} y={720} h={8} delay={26} />

			{/* Subtitle — spring translate */}
			<div
				style={{
					position: 'absolute',
					left: 60,
					top: 748,
					width: W - 120,
					transform: `translateY(${interpolate(subSp, [0, 1], [40, 0])}px)`,
					opacity: subSp,
					fontSize: 40,
					color: 'rgba(255,255,255,0.7)',
					fontFamily: 'sans-serif',
					lineHeight: 1.4,
				}}
			>
				AI-powered editorial intelligence from fMRI brain signals
			</div>

			{/* Progress bar sweeps across entire scene */}
			<ProgressBar color={CYAN} y={H - 80} startFrame={0} durationF={88} />
		</AbsoluteFill>
	);
};

// ─── Scene 2 — CONTENT ───────────────────────────────────────────────────────
// Effects: Slide-in list items · Lower-third strip · Badge · AccentBar

const SceneContent: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const bullets = [
		{icon: '🧠', text: 'TRIBE v2 fMRI brain encoding'},
		{icon: '🎬', text: 'Frame-accurate cut points'},
		{icon: '📈', text: 'Yeo-7 network z-scores'},
		{icon: '⚡', text: 'Real-time editorial recs'},
	];

	// Lower-third slides up
	const ltSp = spring({fps, frame, config: {damping: 130}});
	const ltY = interpolate(ltSp, [0, 1], [220, 0]);

	return (
		<AbsoluteFill>
			<KenBurns from="#071428" to="#0f2240" zoomDir="out" />
			<Particles count={28} color="#60a5fa" />
			<BottomScrim />

			<Badge text="HOW IT WORKS" color={CYAN} x={60} y={110} delay={0} />

			{/* Section headline */}
			<div style={{position: 'absolute', left: 60, top: 240, width: W - 120}}>
				<WordReveal
					text="Four Steps to Smarter Editing"
					startFrame={6}
					stagger={5}
					style={{
						fontSize: 84,
						fontWeight: 900,
						fontFamily: 'sans-serif',
						color: 'white',
						lineHeight: 1.08,
					}}
				/>
			</div>

			<AccentBar
				color={`linear-gradient(90deg,${CYAN},${PURPLE})`}
				y={560}
				h={6}
				delay={18}
			/>

			{/* Staggered bullet items — each slides in from left */}
			<div
				style={{
					position: 'absolute',
					left: 60,
					top: 600,
					width: W - 120,
				}}
			>
				{bullets.map(({icon, text}, i) => {
					const bSp = spring({
						fps,
						frame: Math.max(0, frame - 22 - i * 13),
						config: {damping: 180},
					});
					const bX = interpolate(bSp, [0, 1], [-90, 0]);
					return (
						<div
							key={i}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 26,
								marginBottom: 48,
								transform: `translateX(${bX}px)`,
								opacity: bSp,
							}}
						>
							<div
								style={{
									width: 84,
									height: 84,
									borderRadius: 22,
									background: 'rgba(6,182,212,0.16)',
									border: '2px solid rgba(6,182,212,0.38)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: 40,
									flexShrink: 0,
								}}
							>
								{icon}
							</div>
							<div
								style={{
									fontSize: 44,
									fontWeight: 700,
									color: 'white',
									fontFamily: 'sans-serif',
									lineHeight: 1.2,
								}}
							>
								{text}
							</div>
						</div>
					);
				})}
			</div>

			{/* Lower third — slides up */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					right: 0,
					transform: `translateY(${ltY}px)`,
				}}
			>
				<div
					style={{
						background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})`,
						padding: '34px 60px',
					}}
				>
					<div
						style={{
							color: 'white',
							fontSize: 38,
							fontWeight: 800,
							fontFamily: 'sans-serif',
							letterSpacing: 1,
						}}
					>
						tribe-v2-engagement-analysis
					</div>
					<div
						style={{
							color: 'rgba(255,255,255,0.78)',
							fontSize: 30,
							fontFamily: 'monospace',
						}}
					>
						github.com/exhuman777
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Scene 3 — STATS ─────────────────────────────────────────────────────────
// Effects: CountUp numbers · Scale-in cards · Split bg · Particles · AccentBar

const SceneStats: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const stats = [
		{to: 63, suffix: 's', label: 'Stimulus', color: CYAN},
		{to: 7, suffix: '', label: 'Networks', color: PURPLE},
		{to: 2.3, suffix: 'σ', label: 'Peak z', color: GREEN},
		{to: 30, suffix: 'fps', label: 'Render', color: ORANGE},
	];

	return (
		<AbsoluteFill>
			{/* Split colour bg */}
			<AbsoluteFill style={{background: '#08080f'}} />
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: W / 2,
					height: H,
					background: `linear-gradient(180deg, ${PURPLE}1a, ${CYAN}0d)`,
				}}
			/>
			<Particles count={55} color={CYAN} />

			<Badge text="BY THE NUMBERS" color={ORANGE} x={60} y={110} delay={0} />

			<div style={{position: 'absolute', left: 60, top: 250, width: W - 120}}>
				<WordReveal
					text="The Science of Engagement"
					startFrame={6}
					stagger={6}
					style={{
						fontSize: 84,
						fontWeight: 900,
						fontFamily: 'sans-serif',
						color: 'white',
						lineHeight: 1.05,
					}}
				/>
			</div>

			{/* Stat cards — scale in with stagger */}
			<div
				style={{
					position: 'absolute',
					left: 60,
					top: 640,
					width: W - 120,
					display: 'grid',
					gridTemplateColumns: '1fr 1fr',
					gap: 36,
				}}
			>
				{stats.map(({to, suffix, label, color}, i) => {
					const cSp = spring({
						fps,
						frame: Math.max(0, frame - 18 - i * 11),
						config: {damping: 160},
					});
					return (
						<div
							key={label}
							style={{
								background: 'rgba(255,255,255,0.05)',
								border: `2px solid ${color}44`,
								borderRadius: 30,
								padding: '44px 32px',
								transform: `scale(${interpolate(cSp, [0, 1], [0.7, 1])})`,
								opacity: cSp,
								boxShadow: `0 0 44px ${color}1a`,
							}}
						>
							{/* Counting number */}
							<CountUp
								to={to}
								suffix={suffix}
								startFrame={22 + i * 11}
								durationF={45}
								style={{
									fontSize: 88,
									fontWeight: 900,
									color,
									fontFamily: 'monospace',
									lineHeight: 1,
								}}
							/>
							<div
								style={{
									fontSize: 30,
									color: 'rgba(255,255,255,0.5)',
									fontFamily: 'sans-serif',
									fontWeight: 600,
									marginTop: 10,
									letterSpacing: 2.5,
								}}
							>
								{label.toUpperCase()}
							</div>
						</div>
					);
				})}
			</div>

			<AccentBar
				color={`linear-gradient(90deg,${PURPLE},${CYAN})`}
				y={H - 100}
				h={6}
				delay={12}
			/>
		</AbsoluteFill>
	);
};

// ─── Scene 4 — CTA ───────────────────────────────────────────────────────────
// Effects: Giant "YOU" with spring + pulse · Scale-in CTA · Follow badge · Tech badge · ProgressBar

const SceneCTA: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// Spring entrance
	const sp = spring({fps, frame, config: {damping: 140}});
	// Continuous pulse using Math.sin (deterministic — not Math.random)
	const pulse = 1 + Math.sin(frame * 0.11) * 0.02;

	// "YOU" bounces in
	const youSp = spring({
		fps,
		frame: Math.max(0, frame - 10),
		config: {damping: 110, stiffness: 300},
	});

	// CTA button slides up after YOU appears
	const ctaSp = spring({fps, frame: Math.max(0, frame - 30), config: {damping: 160}});
	const ctaY = interpolate(ctaSp, [0, 1], [60, 0]);

	return (
		<AbsoluteFill>
			<KenBurns from="#0f0224" to="#1a0533" zoomDir="out" />
			<Particles count={70} color={PINK} />
			<Vignette strength={0.5} />

			{/* Giant "YOU" — spring scale + continuous pulse */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 260,
					textAlign: 'center',
					transform: `scale(${youSp * pulse})`,
					opacity: youSp,
				}}
			>
				<div
					style={{
						fontSize: 340,
						fontWeight: 900,
						fontFamily: 'sans-serif',
						background: `linear-gradient(135deg, ${PURPLE}, ${CYAN}, ${PINK})`,
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						lineHeight: 0.88,
						letterSpacing: -10,
					}}
				>
					YOU
				</div>
			</div>

			{/* CTA headline — word reveal */}
			<div
				style={{
					position: 'absolute',
					left: 60,
					top: 920,
					width: W - 120,
					transform: `translateY(${ctaY}px)`,
					opacity: ctaSp,
				}}
			>
				<WordReveal
					text="Start cutting smarter today"
					startFrame={30}
					stagger={4}
					style={{
						fontSize: 76,
						fontWeight: 800,
						fontFamily: 'sans-serif',
						color: 'white',
						lineHeight: 1.1,
						textAlign: 'center',
					}}
				/>
			</div>

			{/* Follow button — scale + pulse */}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: 1190,
					transform: `translateX(-50%) scale(${interpolate(sp, [0, 1], [0.5, 1]) * pulse})`,
					opacity: sp,
					whiteSpace: 'nowrap',
				}}
			>
				<div
					style={{
						padding: '26px 64px',
						borderRadius: 999,
						background: `linear-gradient(90deg, ${PURPLE}, ${CYAN})`,
						color: 'white',
						fontSize: 46,
						fontWeight: 800,
						fontFamily: 'sans-serif',
						boxShadow: `0 0 70px ${PURPLE}66`,
					}}
				>
					★ &nbsp;Follow for more
				</div>
			</div>

			{/* "Tech" badge */}
			<Badge text="Tech" color={CYAN} x={W / 2 - 70} y={1420} delay={35} />

			{/* Accent bar */}
			<AccentBar
				color={`linear-gradient(90deg,${PINK},${PURPLE})`}
				y={1550}
				h={6}
				delay={20}
			/>

			{/* Progress bar */}
			<ProgressBar color={PURPLE} y={H - 80} startFrame={0} durationF={88} />
		</AbsoluteFill>
	);
};

// ─── Composition ──────────────────────────────────────────────────────────────

export type TemplateProps = Record<string, never>;
export const templateDefaultProps: TemplateProps = {};

export const TemplateShowcase: React.FC<TemplateProps> = () => {
	const SCENE = 90;

	return (
		<TransitionSeries>
			<TransitionSeries.Sequence durationInFrames={SCENE}>
				<SceneHook />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				timing={springTiming({config: {damping: 200}})}
				presentation={wipe({direction: 'from-left'})}
			/>

			<TransitionSeries.Sequence durationInFrames={SCENE}>
				<SceneContent />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				timing={linearTiming({durationInFrames: 20})}
				presentation={fade()}
			/>

			<TransitionSeries.Sequence durationInFrames={SCENE}>
				<SceneStats />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				timing={springTiming({config: {damping: 200}})}
				presentation={wipe({direction: 'from-bottom'})}
			/>

			<TransitionSeries.Sequence durationInFrames={SCENE}>
				<SceneCTA />
			</TransitionSeries.Sequence>
		</TransitionSeries>
	);
};
