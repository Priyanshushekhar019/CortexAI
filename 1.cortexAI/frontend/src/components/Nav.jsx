import { MessageSquare, LayoutGrid, Mic, Sparkles, Code2 } from 'lucide-react'
import React from 'react'
import { useSelector } from 'react-redux'

function Nav({ viewMode = 'chat', onViewChange, onOpenVoiceMode }) {
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages, artifacts } = useSelector(state => state.message)

  return (
    <div className='h-14 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#0d0f14] shrink-0'>
      <div className='flex items-center gap-2.5 min-w-0'>
        <div className='flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0'>
          <MessageSquare size={13} className="text-indigo-400" />
        </div>
        <div className='text-[14px] font-semibold text-slate-100 tracking-tight truncate max-w-xs md:max-w-md'>
          {selectedConversation?.title || "New Chat"}
        </div>
        <div className='text-[10px] font-medium text-slate-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full shrink-0'>
          {messages?.length || 0} Messages
        </div>
      </div>

      <div className='flex items-center gap-2'>
        {/* Sandbox Quick Opener if code/artifacts exist */}
        {artifacts && artifacts.length > 0 && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-artifact-panel'))}
            className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/20 transition text-xs font-medium cursor-pointer'
            title="Open Code Artifact Sandbox"
          >
            <Code2 size={13} className="text-indigo-400" />
            <span className="hidden md:inline">Code Sandbox</span>
          </button>
        )}

        {/* View Mode Switcher: Chat vs Canvas */}
        <div className='flex items-center bg-white/[0.03] border border-white/[0.07] p-1 rounded-xl'>
          <button
            onClick={() => onViewChange && onViewChange('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              viewMode === 'chat' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare size={12} />
            <span>Chat</span>
          </button>
          <button
            onClick={() => onViewChange && onViewChange('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              viewMode === 'canvas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={12} />
            <span>Canvas</span>
          </button>
        </div>

        {/* Voice Mode Button */}
        {onOpenVoiceMode && (
          <button
            onClick={onOpenVoiceMode}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 text-white text-xs font-medium shadow-[0_1px_8px_rgba(99,102,241,.3)] transition cursor-pointer'
            title="Start Full-Duplex Voice Mode"
          >
            <Mic size={13} />
            <span className="hidden sm:inline">Voice Mode</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default Nav
