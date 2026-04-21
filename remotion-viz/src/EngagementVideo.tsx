import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	spring,
	random,
} from 'remotion';

// ─── Data ─────────────────────────────────────────────────────────────────────

const TOTAL_S = 63;

// Deterministic engagement curve matching README example output
// Peak at 9-12s (VAN+Limbic), valley at 34-41s (Default+FPN elevated)
const ENG: number[] = Array.from({length: TOTAL_S}, (_, i) => {
	const noise = (random(`n${i}`) - 0.5) * 0.85;
	const wave = Math.sin(i * 0.27) * 0.48 + Math.cos(i * 0.13) * 0.28;
	const peak =
		i >= 9 && i <= 12 ? (1 - Math.abs(i - 10.5) / 1.8) * 2.15 : 0;
	const valley =
		i >= 34 && i <= 41 ? -(1 - Math.abs(i - 37.5) / 3.8) * 1.87 : 0;
	return Math.max(-2.5, Math.min(2.5, noise + wave + peak + valley));
});

const NETWORKS = [
	{id: 'Visual',          color: '#60a5fa', z:  0.14},
	{id: 'Somatomotor',     color: '#34d399', z: -0.02},
	{id: 'DorsalAttn',      color: '#a78bfa', z:  0.31},
	{id: 'VentralAttn',     color: '#fb923c', z:  0.22},
	{id: 'Limbic',          color: '#f472b6', z:  0.18},
	{id: 'Frontoparietal',  color: '#fbbf24', z: -0.08},
	{id: 'Default',         color: '#94a3b8', z: -0.15},
];

// ─── Layout ───────────────────────────────────────────────────────────────────

const CL = 160, CR = 1760, CT = 90, CB = 545;
const CW = CR - CL, CH = CB - CT;
const ZERO_Y = CT + CH / 2;

const BL = 160, BR = 1760, BT = 625, BB = 970;
const BW = BR - BL, BH = BB - BT;
const BAR_W = BW / NETWORKS.length;
const BAR_ZERO_Y = BT + BH * (2.5 / 5);

function iToX(i: number) { return CL + (i / (TOTAL_S - 1)) * CW; }
function zToY(z: number) { return ZERO_Y - (z / 2.5) * (CH / 2); }

function buildPath(progress: number): string {
	const visible = Math.max(2, Math.floor(TOTAL_S * progress));
	return ENG.slice(0, visible)
		.map((z, i) => `${i === 0 ? 'M' : 'L'}${iToX(i).toFixed(1)} ${zToY(z).toFixed(1)}`)
		.join(' ');
}

// ─── Components ───────────────────────────────────────────────────────────────

const Stars: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
			{Array.from({length: 160}, (_, i) => {
				const x = random(`sx${i}`) * 1920;
				const y = random(`sy${i}`) * 1080;
				const r = random(`sr${i}`) * 1.6 + 0.3;
				const spd = random(`ss${i}`) * 0.035 + 0.008;
				const ph = random(`sp${i}`) * 6.28;
				return (
					<circle
						key={i} cx={x} cy={y} r={r} fill="white"
						opacity={0.1 + Math.sin(frame * spd + ph) * 0.07}
					/>
				);
			})}
		</svg>
	);
};

const ScanLine: React.FC<{progress: number}> = ({progress}) => {
	if (progress <= 0 || progress >= 1) return null;
	const x = CL + progress * CW;
	return (
		<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
			<line x1={x} y1={CT} x2={x} y2={CB}
				stroke="rgba(255,255,255,0.6)" strokeWidth={2}/>
			<circle cx={x} cy={zToY(ENG[Math.floor(progress * (TOTAL_S - 1))]) }
				r={7} fill="#ffffff" opacity={0.9}/>
		</svg>
	);
};

const ChartGrid: React.FC<{opacity: number}> = ({opacity}) => (
	<svg width="1920" height="1080"
		style={{position: 'absolute', inset: 0, opacity}}>
		<defs>
			<filter id="glow">
				<feGaussianBlur stdDeviation="5" result="b"/>
				<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
			</filter>
		</defs>

		{/* z-score horizontal rules */}
		{[-2, -1, 0, 1, 2].map((z) => {
			const y = zToY(z);
			const isZero = z === 0;
			return (
				<g key={z}>
					<line x1={CL} y1={y} x2={CR} y2={y}
						stroke={isZero ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.09)'}
						strokeWidth={isZero ? 2 : 1}
						strokeDasharray={isZero ? undefined : '4 12'}/>
					<text x={CL - 14} y={y + 6} fill="rgba(255,255,255,0.4)"
						fontSize={17} textAnchor="end" fontFamily="monospace">
						{z > 0 ? `+${z}` : z}σ
					</text>
				</g>
			);
		})}

		{/* time ticks every 10s */}
		{[0, 10, 20, 30, 40, 50, 60].map((s) => {
			const x = iToX(s);
			return (
				<g key={s}>
					<line x1={x} y1={CT} x2={x} y2={CB}
						stroke="rgba(255,255,255,0.06)" strokeWidth={1}/>
					<text x={x} y={CB + 30} fill="rgba(255,255,255,0.38)"
						fontSize={16} textAnchor="middle" fontFamily="monospace">{s}s</text>
				</g>
			);
		})}

		{/* axis label */}
		<text x={72} y={ZERO_Y} fill="rgba(255,255,255,0.45)" fontSize={17}
			textAnchor="middle" fontFamily="sans-serif"
			transform={`rotate(-90,72,${ZERO_Y})`}>
			engagement z-score
		</text>

		{/* chart border */}
		<rect x={CL} y={CT} width={CW} height={CH}
			fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} rx={4}/>

		{/* bar chart zero line */}
		<line x1={BL} y1={BAR_ZERO_Y} x2={BR} y2={BAR_ZERO_Y}
			stroke="rgba(255,255,255,0.22)" strokeWidth={1.5}/>
		<text x={BL - 14} y={BAR_ZERO_Y + 6} fill="rgba(255,255,255,0.38)"
			fontSize={17} textAnchor="end" fontFamily="monospace">0σ</text>

		{/* bar chart border */}
		<rect x={BL} y={BT} width={BW} height={BH}
			fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} rx={4}/>
	</svg>
);

const Region: React.FC<{
	startS: number; endS: number;
	color: string; label: string; sublabel: string;
	opacity: number;
}> = ({startS, endS, color, label, sublabel, opacity}) => {
	const x1 = iToX(startS), x2 = iToX(endS);
	const id = `rg${startS}`;
	return (
		<svg width="1920" height="1080"
			style={{position: 'absolute', inset: 0, opacity}}>
			<defs>
				<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={color} stopOpacity="0.28"/>
					<stop offset="100%" stopColor={color} stopOpacity="0.04"/>
				</linearGradient>
			</defs>
			<rect x={x1} y={CT} width={x2 - x1} height={CH} fill={`url(#${id})`}/>
			<line x1={x1} y1={CT} x2={x1} y2={CB}
				stroke={color} strokeWidth={2} strokeDasharray="6 5" opacity={0.85}/>
			<line x1={x2} y1={CT} x2={x2} y2={CB}
				stroke={color} strokeWidth={2} strokeDasharray="6 5" opacity={0.85}/>
			<text x={(x1 + x2) / 2} y={CT - 24} fill={color}
				fontSize={21} fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
				{label}
			</text>
			<text x={(x1 + x2) / 2} y={CT - 6} fill={color}
				fontSize={15} fontWeight="400" textAnchor="middle"
				fontFamily="monospace" opacity={0.72}>
				{sublabel}
			</text>
		</svg>
	);
};

const EngagementCurve: React.FC<{progress: number}> = ({progress}) => {
	const path = buildPath(progress);
	const dotIdx = Math.max(1, Math.floor(TOTAL_S * progress) - 1);
	const dotX = iToX(dotIdx);
	const dotY = zToY(ENG[dotIdx]);
	return (
		<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
			<defs>
				<filter id="curveglow">
					<feGaussianBlur stdDeviation="6" result="b"/>
					<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
				</filter>
				<linearGradient id="curvegrad" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%"   stopColor="#7c3aed"/>
					<stop offset="45%"  stopColor="#06b6d4"/>
					<stop offset="100%" stopColor="#10b981"/>
				</linearGradient>
			</defs>
			{/* glow layer */}
			<path d={path} stroke="url(#curvegrad)" strokeWidth={10}
				fill="none" opacity={0.35} filter="url(#curveglow)"/>
			{/* main line */}
			<path d={path} stroke="url(#curvegrad)" strokeWidth={3.5}
				fill="none" opacity={0.95}/>
			{/* leading dot */}
			{progress > 0.02 && (
				<circle cx={dotX} cy={dotY} r={8} fill="#ffffff"
					filter="url(#curveglow)" opacity={0.95}/>
			)}
		</svg>
	);
};

const NetworkBars: React.FC<{fps: number}> = ({fps}) => {
	const frame = useCurrentFrame();
	return (
		<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
			<defs>
				{NETWORKS.map((net) => (
					<linearGradient key={net.id} id={`bg_${net.id}`}
						x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%"   stopColor={net.color} stopOpacity="0.95"/>
						<stop offset="100%" stopColor={net.color} stopOpacity="0.35"/>
					</linearGradient>
				))}
			</defs>
			{NETWORKS.map((net, i) => {
				const frac = spring({
					fps,
					frame: Math.max(0, frame - i * 9),
					config: {damping: 180},
				});
				const scaledZ = net.z * frac;
				const barH = Math.abs(scaledZ / 2.5) * BH * 0.82;
				const barX = BL + i * BAR_W + BAR_W * 0.14;
				const barW = BAR_W * 0.72;
				const barY = scaledZ >= 0 ? BAR_ZERO_Y - barH : BAR_ZERO_Y;
				const labelY = BB + 26;
				const valY = scaledZ >= 0 ? barY - 9 : barY + barH + 22;
				return (
					<g key={net.id} opacity={frac}>
						<rect x={barX} y={barY} width={barW} height={Math.max(barH, 0)}
							fill={`url(#bg_${net.id})`} rx={5}/>
						<text x={barX + barW / 2} y={labelY} fill={net.color}
							fontSize={16} textAnchor="middle" fontFamily="sans-serif"
							fontWeight="600">
							{net.id}
						</text>
						<text x={barX + barW / 2} y={valY} fill={net.color}
							fontSize={17} textAnchor="middle" fontFamily="monospace"
							fontWeight="700">
							{scaledZ > 0 ? `+${scaledZ.toFixed(2)}` : scaledZ.toFixed(2)}σ
						</text>
					</g>
				);
			})}
		</svg>
	);
};

const TitleCard: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const scale = spring({fps, frame, config: {damping: 160}});
	const opacity = interpolate(frame, [0, 18], [0, 1], {
		extrapolateRight: 'clamp',
	});
	const tags = ['63 s stimulus', 'Yeo-7 networks', 'fMRI brain encoding'];
	return (
		<AbsoluteFill style={{
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			flexDirection: 'column', gap: 22,
			transform: `scale(${scale})`, opacity,
		}}>
			<div style={{
				fontSize: 72, fontWeight: 900, fontFamily: 'sans-serif',
				background: 'linear-gradient(135deg,#7c3aed 0%,#06b6d4 55%,#10b981 100%)',
				WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
				letterSpacing: -1.5, textAlign: 'center', lineHeight: 1.08,
			}}>
				TRIBE v2<br/>Engagement Analysis
			</div>
			<div style={{
				fontSize: 24, color: 'rgba(255,255,255,0.5)',
				fontFamily: 'monospace', letterSpacing: 4,
			}}>
				Editorial Intelligence · Powered by fMRI
			</div>
			<div style={{display: 'flex', gap: 28, marginTop: 14}}>
				{tags.map((tag) => (
					<div key={tag} style={{
						padding: '9px 22px', borderRadius: 999,
						border: '1px solid rgba(255,255,255,0.18)',
						color: 'rgba(255,255,255,0.55)', fontSize: 18,
						fontFamily: 'sans-serif',
					}}>{tag}</div>
				))}
			</div>
		</AbsoluteFill>
	);
};

const AnnotationCard: React.FC<{
	x: number; y: number; w: number;
	color: string; title: string; lines: string[];
	slideOffset: number;
	opacity: number;
}> = ({x, y, w, color, title, lines, slideOffset, opacity}) => (
	<div style={{
		position: 'absolute',
		left: x + slideOffset, top: y, width: w,
		background: 'rgba(8,8,20,0.82)',
		border: `1.5px solid ${color}`,
		borderRadius: 14, padding: '20px 26px',
		boxShadow: `0 0 32px ${color}33`,
		opacity,
	}}>
		<div style={{
			color, fontSize: 19, fontWeight: 800,
			fontFamily: 'sans-serif', letterSpacing: 1.5, marginBottom: 12,
		}}>{title}</div>
		{lines.map((ln, i) => (
			<div key={i} style={{
				color: 'rgba(255,255,255,0.78)', fontSize: 17,
				fontFamily: 'monospace', lineHeight: 1.75,
			}}>{ln}</div>
		))}
	</div>
);

const SummaryPanel: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const progress = spring({fps, frame, config: {damping: 180}});
	const translateY = interpolate(progress, [0, 1], [60, 0]);
	const opacity = interpolate(frame, [0, 20], [0, 1], {
		extrapolateRight: 'clamp',
	});
	const stats = [
		{label: 'Duration',       value: '63.0 s'},
		{label: 'Mean z-score',   value: '+0.02 σ'},
		{label: 'Peak',           value: '+2.31 σ @ 0:10'},
		{label: 'Valley',         value: '−1.87 σ @ 0:37'},
		{label: 'Cut segment',    value: '0:34 – 0:41 (7 s)'},
		{label: 'Keep segment',   value: '0:09 – 0:12 ★'},
	];
	return (
		<AbsoluteFill style={{
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			transform: `translateY(${translateY}px)`, opacity,
		}}>
			<div style={{
				background: 'rgba(6,6,18,0.88)',
				border: '1px solid rgba(255,255,255,0.13)',
				borderRadius: 22, padding: '52px 72px', minWidth: 780,
				boxShadow: '0 0 100px rgba(124,58,237,0.18)',
			}}>
				<div style={{
					fontSize: 38, fontWeight: 800, fontFamily: 'sans-serif',
					color: 'white', marginBottom: 36, letterSpacing: -0.5,
				}}>
					Analysis Summary
				</div>
				<div style={{
					display: 'grid', gridTemplateColumns: '1fr 1fr',
					gap: '18px 56px',
				}}>
					{stats.map(({label, value}) => (
						<div key={label}>
							<div style={{
								color: 'rgba(255,255,255,0.38)', fontSize: 13,
								fontFamily: 'monospace', letterSpacing: 2.5, marginBottom: 5,
							}}>
								{label.toUpperCase()}
							</div>
							<div style={{
								color: 'white', fontSize: 22,
								fontFamily: 'monospace', fontWeight: 600,
							}}>
								{value}
							</div>
						</div>
					))}
				</div>
				<div style={{
					marginTop: 34, paddingTop: 26,
					borderTop: '1px solid rgba(255,255,255,0.09)',
					color: 'rgba(255,255,255,0.35)', fontSize: 14,
					fontFamily: 'monospace',
				}}>
					E(t) = z(DAN) + z(VAN) + z(Limbic) + z(Visual) − z(DMN)
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Main composition ─────────────────────────────────────────────────────────

export type VideoProps = Record<string, never>;
export const defaultProps: VideoProps = {};

export const EngagementVideo: React.FC<VideoProps> = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// Global timing constants (all in absolute frames)
	const TITLE_IN    = 0;
	const TITLE_OUT   = 90;   // title fades away
	const CHART_IN    = 75;   // chart fades in
	const CURVE_START = 85;
	const CURVE_END   = 220;
	const REGION_IN   = 145;
	const BARS_START  = 185;
	const ANNOT_IN    = 225;
	const SUMMARY_IN  = 320;

	const chartOpacity  = interpolate(frame, [CHART_IN, CHART_IN + 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const titleOpacity  = interpolate(frame, [TITLE_IN, TITLE_IN + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
	                    * interpolate(frame, [TITLE_OUT - 20, TITLE_OUT], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const curveProgress = interpolate(frame, [CURVE_START, CURVE_END], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const regionOpacity = interpolate(frame, [REGION_IN, REGION_IN + 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const annotOpacity  = interpolate(frame, [ANNOT_IN, ANNOT_IN + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	// Annotation cards slide in from edges
	const annotProgress = spring({fps, frame: Math.max(0, frame - ANNOT_IN), config: {damping: 200}});
	const slideAmt = interpolate(annotProgress, [0, 1], [90, 0]);

	return (
		<AbsoluteFill style={{
			background: 'linear-gradient(160deg,#040810 0%,#0c1524 60%,#040810 100%)',
		}}>
			{/* ── Layer 0: Twinkling stars ── */}
			<Stars />

			{/* ── Layer 1: Title card ── */}
			<AbsoluteFill style={{opacity: titleOpacity}}>
				<Sequence from={TITLE_IN} durationInFrames={TITLE_OUT + 5}>
					<TitleCard />
				</Sequence>
			</AbsoluteFill>

			{/* ── Layer 2: Full chart area ── */}
			<AbsoluteFill style={{opacity: chartOpacity}}>
				<ChartGrid opacity={1} />

				{/* Highlighted regions */}
				<Region
					startS={9} endS={12} color="#22c55e"
					label="★  PROTECT — PEAK ENGAGEMENT"
					sublabel="VentralAttn · Limbic   |   max z = +2.31"
					opacity={regionOpacity}
				/>
				<Region
					startS={34} endS={41} color="#ef4444"
					label="✂  CUT CANDIDATE — MIND WANDERING"
					sublabel="Default · Frontoparietal elevated   |   min z = −1.87"
					opacity={regionOpacity}
				/>

				{/* Drawing curve + scan dot */}
				<EngagementCurve progress={curveProgress} />
				<ScanLine progress={curveProgress < 1 ? curveProgress : -1} />

				{/* Network bars spring up after curve finishes drawing */}
				<Sequence from={BARS_START}>
					<NetworkBars fps={fps} />
				</Sequence>
			</AbsoluteFill>

			{/* ── Layer 3: Annotation cards (slide in from edges) ── */}
			<AbsoluteFill style={{opacity: annotOpacity, pointerEvents: 'none'}}>
				<AnnotationCard
					x={32} y={200} w={370}
					color="#22c55e" title="★  KEEP — THUMBNAIL HOOK"
					lines={[
						'0:09 – 0:12  (3 seconds)',
						'Peak z-score: +2.31 σ',
						'Driven by: VAN + Limbic',
						'→ Use as cold open / thumbnail',
					]}
					slideOffset={-slideAmt}
					opacity={1}
				/>
				<AnnotationCard
					x={1518} y={200} w={370}
					color="#ef4444" title="✂  CUT — TIGHTEN"
					lines={[
						'0:34 – 0:41  (7 seconds)',
						'Min z-score: −1.87 σ',
						'Default + FPN elevated',
						'→ Trim or restructure',
					]}
					slideOffset={slideAmt}
					opacity={1}
				/>
			</AbsoluteFill>

			{/* ── Layer 4: Summary panel ── */}
			<Sequence from={SUMMARY_IN}>
				<AbsoluteFill style={{
					background: 'linear-gradient(160deg,rgba(4,8,16,0.75) 0%,rgba(12,21,36,0.75) 100%)',
				}}>
					<SummaryPanel />
				</AbsoluteFill>
			</Sequence>
		</AbsoluteFill>
	);
};
