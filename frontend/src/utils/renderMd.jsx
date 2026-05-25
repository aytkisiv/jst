/**
 * Minimal inline markdown renderer for tutor messages.
 * Supports: **bold**, `code`, ___ blanks, bullet lists, newlines.
 */
/**
 * @param {string} text
 * @param {'light'|'dark'} theme - 'light' for chat (default), 'dark' for dark backgrounds
 */
export default function renderMd(text, theme = 'light') {
  if (!text) return null;
  const boldColor  = theme === 'dark' ? '#c8aaff' : '#5234a0';
  const codeColor  = theme === 'dark' ? '#fc79bd' : '#e879a0';
  const codeBg     = theme === 'dark' ? 'rgba(252,121,189,0.15)' : 'rgba(232,121,160,0.10)';
  const blankColor = theme === 'dark' ? '#c8aaff' : '#6343a4';
  const dotColor   = theme === 'dark' ? 'rgba(200,170,255,0.8)' : '#6343a4';

  return text.split('\n').map((line, li) => {
    const isBullet = /^[-•]\s/.test(line);
    const parts = (isBullet ? line.slice(2) : line)
      .split(/(\*\*[^*]+\*\*|`[^`]+`|___+)/g)
      .map((part, pi) => {
        if (/^\*\*[^*]+\*\*$/.test(part))
          return <strong key={pi} style={{ fontWeight: 600, color: boldColor }}>{part.slice(2, -2)}</strong>;
        if (/^`[^`]+`$/.test(part))
          return <code key={pi} style={{ padding: '1px 6px', borderRadius: 4, fontSize: 13, fontFamily: 'monospace', color: codeColor, background: codeBg }}>{part.slice(1, -1)}</code>;
        if (/^_+$/.test(part))
          return <span key={pi} style={{ display: 'inline-block', borderBottom: `2px solid ${blankColor}`, padding: '0 8px', margin: '0 2px', minWidth: 32, textAlign: 'center', color: blankColor, fontWeight: 700 }}>?</span>;
        return part;
      });
    return (
      <div key={li} style={{ marginTop: li > 0 ? 6 : 0, display: isBullet ? 'flex' : 'block', gap: isBullet ? 8 : 0, alignItems: isBullet ? 'flex-start' : undefined }}>
        {isBullet && <span style={{ marginTop: 7, width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'inline-block' }} />}
        <span>{parts}</span>
      </div>
    );
  });
}
