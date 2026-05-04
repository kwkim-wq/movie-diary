// Posters — Minimal cinephile DB. Dark, moody, single soft-green accent.

const Poster = ({ kind, style }) => {
  const base = { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', ...style };
  const TXT = '#E5E7EB';
  const MUTED = '#9CA3AF';
  const ACC = '#62D26F';

  if (kind === 'wong') {
    return (
      <div style={{ ...base, background: 'linear-gradient(160deg, #1a0e14 0%, #2a1218 50%, #3a1a20 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 35%, rgba(255, 180, 130, 0.15) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', left: '14%', top: '32%', width: '36%', height: '52%', background: '#0a0608', borderRadius: '50% 50% 48% 52% / 60% 58% 42% 40%' }} />
        <div style={{ position: 'absolute', right: '8%', top: '14%', fontFamily: 'Inter', fontWeight: 700, color: TXT, fontSize: 13, letterSpacing: '0.18em', textAlign: 'right', lineHeight: 1.15 }}>IN<br/>THE<br/>MOOD</div>
        <div style={{ position: 'absolute', right: '8%', bottom: '8%', fontFamily: 'Inter', color: 'rgba(229,231,235,0.6)', fontSize: 8, letterSpacing: '0.15em', fontWeight: 500 }}>2000 · WKW</div>
      </div>
    );
  }
  if (kind === 'kubrick') {
    return (
      <div style={{ ...base, background: '#050608' }}>
        <div style={{ position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%,-50%)', width: '46%', aspectRatio: '1', borderRadius: '50%', background: 'radial-gradient(circle, #f4c200 0%, #e87618 50%, #802018 100%)', boxShadow: '0 0 50px rgba(232, 118, 24, 0.45)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '10%', textAlign: 'center', fontFamily: 'Inter', fontWeight: 700, color: TXT, fontSize: 18, letterSpacing: '0.3em' }}>2001</div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '18%', textAlign: 'center', fontFamily: 'Inter', color: MUTED, fontSize: 7, letterSpacing: '0.2em', fontWeight: 500 }}>A SPACE ODYSSEY</div>
      </div>
    );
  }
  if (kind === 'noir') {
    return (
      <div style={{ ...base, background: 'linear-gradient(180deg, #0e1116 0%, #1a1f28 60%, #232a35 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(95deg, rgba(0,0,0,0.45) 0 2px, transparent 2px 18px)' }} />
        <div style={{ position: 'absolute', left: '10%', right: '10%', top: '14%', fontFamily: 'Inter', fontWeight: 700, color: TXT, fontSize: 13, lineHeight: 1.2, textAlign: 'center', letterSpacing: '0.05em' }}>THE<br/><span style={{ fontSize: 22, letterSpacing: '0.08em' }}>THIRD MAN</span></div>
        <div style={{ position: 'absolute', left: '50%', bottom: '14%', transform: 'translateX(-50%)', width: '42%', height: '38%', background: 'radial-gradient(ellipse at center, rgba(229,231,235,0.18) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', left: '50%', bottom: '20%', transform: 'translateX(-50%)', width: 3, height: '36%', background: '#050608' }} />
      </div>
    );
  }
  if (kind === 'wes') {
    return (
      <div style={{ ...base, background: 'linear-gradient(180deg, #d68bb0 0%, #e8a8c0 100%)' }}>
        <div style={{ position: 'absolute', left: '20%', right: '20%', top: '18%', bottom: '18%', background: '#f4d8c0' }} />
        {[0,1,2,3,4].map(r => (
          <div key={r} style={{ position: 'absolute', left: '24%', right: '24%', top: `${24 + r*10}%`, height: '6%', display: 'flex', justifyContent: 'space-around' }}>
            {[0,1,2,3].map(c => <div key={c} style={{ width: '14%', background: '#3a1a10' }} />)}
          </div>
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '6%', textAlign: 'center', fontFamily: 'Inter', fontWeight: 700, color: '#3a1a10', fontSize: 11, letterSpacing: '0.06em', lineHeight: 1.15 }}>THE GRAND<br/>BUDAPEST HOTEL</div>
      </div>
    );
  }
  if (kind === 'tarkovsky') {
    return (
      <div style={{ ...base, background: 'linear-gradient(180deg, #0c0e0a 0%, #1a1c14 50%, #0a0c08 100%)' }}>
        <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translateX(-50%)', width: '70%', height: '2px', background: 'rgba(229,231,235,0.4)' }} />
        <div style={{ position: 'absolute', left: '40%', top: '38%', width: '20%', height: '20%', background: '#040504', borderRadius: '50% 50% 0 0' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '8%', textAlign: 'center', fontFamily: 'Inter', fontWeight: 700, color: TXT, fontSize: 22, letterSpacing: '0.4em' }}>STALKER</div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '8%', textAlign: 'center', fontFamily: 'Inter', color: MUTED, fontSize: 7, letterSpacing: '0.2em', fontWeight: 500 }}>1979 · TARKOVSKY</div>
      </div>
    );
  }
  if (kind === 'godard') {
    return (
      <div style={{ ...base, background: '#1a1d24' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: '60%', height: '40%', background: '#c8202e' }} />
        <div style={{ position: 'absolute', right: 0, top: '30%', width: '50%', height: '40%', background: '#1d3a8a' }} />
        <div style={{ position: 'absolute', left: '10%', bottom: '18%', width: '50%', height: '30%', background: '#e8c020' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '8%', textAlign: 'center', fontFamily: 'Inter', fontWeight: 700, color: TXT, fontSize: 18, letterSpacing: '0.15em', lineHeight: 1.2 }}>PIERROT<br/>LE FOU</div>
      </div>
    );
  }
  if (kind === 'kim') {
    return (
      <div style={{ ...base, background: 'radial-gradient(ellipse at center, #2a0a0e 0%, #100204 100%)' }}>
        <div style={{ position: 'absolute', inset: '20% 25%', border: '1.5px solid #c8a04a', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '40%', textAlign: 'center', fontFamily: 'Inter', fontWeight: 700, color: '#c8a04a', fontSize: 22, letterSpacing: '0.04em' }}>OLDBOY</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '54%', textAlign: 'center', fontFamily: 'Pretendard', color: '#c8a04a', fontSize: 11, letterSpacing: '0.4em', fontWeight: 500 }}>올드보이</div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '8%', textAlign: 'center', fontFamily: 'Inter', color: 'rgba(200,160,74,0.7)', fontSize: 7, letterSpacing: '0.2em', fontWeight: 500 }}>2003 · PARK CHAN-WOOK</div>
      </div>
    );
  }
  if (kind === 'fellini') {
    return (
      <div style={{ ...base, background: 'linear-gradient(180deg, #d8c098 0%, #b89870 100%)' }}>
        <div style={{ position: 'absolute', left: '30%', top: '20%', width: '40%', height: '50%', borderRadius: '50%', background: '#0a0608' }} />
        <div style={{ position: 'absolute', left: '38%', top: '32%', width: '6%', height: '6%', borderRadius: '50%', background: '#d8c098' }} />
        <div style={{ position: 'absolute', right: '38%', top: '32%', width: '6%', height: '6%', borderRadius: '50%', background: '#d8c098' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '12%', textAlign: 'center', fontFamily: 'Inter', color: '#0a0608', fontSize: 32, fontWeight: 800 }}>8½</div>
      </div>
    );
  }
  if (kind === 'bong') {
    return (
      <div style={{ ...base, background: '#bbb89a' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '55%', background: '#8aa278' }} />
        {[18,28,42,54,68,78].map((l, i) => (
          <div key={i} style={{ position: 'absolute', left: `${l}%`, top: `${30 + (i%2)*4}%`, width: 5, height: `${22 + (i%3)*2}%`, background: '#0a0608' }} />
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '18%', textAlign: 'center', fontFamily: 'Inter', fontWeight: 700, color: '#0a0608', fontSize: 18, letterSpacing: '0.2em' }}>PARASITE</div>
      </div>
    );
  }
  return (
    <div style={{ ...base, background: 'linear-gradient(135deg, #1F2937 0%, #2C3440 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: MUTED, fontFamily: 'Inter', fontSize: 11, letterSpacing: '0.18em', fontWeight: 500 }}>NO POSTER</div>
    </div>
  );
};

window.Poster = Poster;
