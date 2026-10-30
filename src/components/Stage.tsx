import { forwardRef } from 'react';
import layersJson from '../config/layers.json';
import { HEIGHT, WIDTH, glints, shineLayers, slices } from '../config/timing';

export interface LayerDef {
  id: string; file: string; x: number; y: number; w: number; h: number;
  blend: 'normal' | 'multiply' | 'screen'; role: string; depth: number;
}
export const layers = layersJson as LayerDef[];
const asset = (f: string) => `${import.meta.env.BASE_URL}${f}`;

function LayerView({ l }: { l: LayerDef }) {
  const sl = slices[l.id];
  const url = asset(l.file);
  return (
    <div className="layer" data-layer={l.id} style={{ left: l.x, top: l.y, width: l.w, height: l.h, mixBlendMode: l.blend }}>
      <div className="inner" data-inner={l.id}>
        {sl ? (
          sl.map((s) => (
            <div
              key={s.name}
              className="slice"
              data-slice={`${l.id}:${s.name}`}
              style={{ left: s.x, top: s.y, width: s.w, height: s.h, clipPath: s.free ? `inset(-90px -90px -90px 0)` : 'inset(0)' }}
            >
              <img data-slice-img={`${l.id}:${s.name}`} src={url} alt="" draggable={false}
                   style={{ left: -s.x, top: -s.y, width: l.w, height: l.h }} />
            </div>
          ))
        ) : (
          <img src={url} alt="" draggable={false} width={l.w} height={l.h} />
        )}
      </div>
      {shineLayers.includes(l.id) && (
        <div className="shine" data-shine={l.id} style={{ WebkitMaskImage: `url(${url})`, maskImage: `url(${url})` }}>
          <div className="band" />
        </div>
      )}
    </div>
  );
}

/** The 1080×1350 composition. Stacking order = PSD order; blend modes copied from the PSD. */
export const Stage = forwardRef<HTMLDivElement>(function Stage(_, ref) {
  return (
    <div className="stage" ref={ref} style={{ width: WIDTH, height: HEIGHT }}>
      <div className="camera" data-camera>
        {layers.map((l) => (
          <span key={l.id} style={{ display: 'contents' }}>
            <LayerView l={l} />
            {l.id === 'bg-tint' && <div className="ambient" data-ambient />}
            {l.id === 'glare-bloom' && <canvas className="particles" data-particles width={WIDTH} height={HEIGHT} />}
          </span>
        ))}
        {glints.map((g, i) => (
          <div key={i} className="glint" data-glint={i} style={{ left: g.x - g.size / 2, top: g.y - g.size / 2, width: g.size, height: g.size }}>
            <i className="g-h" /><i className="g-v" /><i className="g-d" /><i className="g-core" />
          </div>
        ))}
      </div>
    </div>
  );
});
