import { motion } from 'framer-motion';

export default function GrammarCard({ correction }) {
  if (!correction) return null;

  const { wrong, correct, rule } = correction;

  return (
    <motion.div
      className="mt-3 rounded-xl p-4 text-sm"
      style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wide text-green-700">Исправление</span>
      </div>
      {wrong && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-red-500 font-medium">✗</span>
          <span className="line-through text-red-400 text-sm">{wrong}</span>
        </div>
      )}
      {correct && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-green-600 font-medium">✓</span>
          <span className="text-green-700 font-semibold text-sm">{correct}</span>
        </div>
      )}
      {rule && (
        <p className="text-xs text-gray-500 italic border-t border-green-200 pt-2 mt-2">{rule}</p>
      )}
    </motion.div>
  );
}
