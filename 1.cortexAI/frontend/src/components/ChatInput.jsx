import { Code2, FileText, Globe, ImageIcon, MessageSquare, Mic, MicOff, Paperclip, Presentation, Send, Users, X, Zap } from 'lucide-react'
import React, { useEffect, useState, useRef } from 'react'
import sendMessage from '../features/sendMessage'
import { useDispatch, useSelector } from 'react-redux'
import { addMessage, setArtifacts, setIsLoading, setMessages } from '../redux/messageSlice'
import { createConversation } from '../features/createConversation'
import { addConversation, setConvTitle, setSelectedConversation } from '../redux/conversationSlice'
import { updateConversation } from '../features/updateConversation'
import VoiceModeModal from './VoiceModeModal'

function ChatInput({ isVoiceModalOpen, onOpenVoiceModal, onCloseVoiceModal }) {
  const [value, setValue] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("Auto")
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages, isLoading } = useSelector(state => state.message)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [localVoiceOpen, setLocalVoiceOpen] = useState(false)
  const fileRef = useRef(null)
  const dispatch = useDispatch()

  const isVoiceOpen = isVoiceModalOpen !== undefined ? isVoiceModalOpen : localVoiceOpen
  const handleOpenVoice = onOpenVoiceModal || (() => setLocalVoiceOpen(true))
  const handleCloseVoice = onCloseVoiceModal || (() => setLocalVoiceOpen(false))

  const latestAssistantMessage = messages
    ?.filter(m => m.role === "assistant")
    ?.slice(-1)[0]?.content || ""

  const handleSendMessage = async (textToSend = null) => {
    const promptText = (textToSend || value).trim()
    if (!promptText && selectedFiles.length === 0) return;

    dispatch(setIsLoading(true))
    let conversation = selectedConversation
    if (!conversation) {
      dispatch(setMessages([]))
      const conv = await createConversation()
      dispatch(setSelectedConversation(conv))
      dispatch(addConversation(conv))
      conversation = conv
    }

    if (conversation?.title === "New Chat") {
      await updateConversation({ id: conversation?._id, title: promptText })
      dispatch(setConvTitle({ conversationId: conversation?._id, title: promptText.slice(0, 40) }))
    }

    const formData = new FormData()
    formData.append("prompt", promptText)
    formData.append("conversationId", conversation?._id)
    formData.append("agent", selectedAgent.toLowerCase() === "team" ? "swarm" : selectedAgent.toLowerCase())

    if (selectedFiles.length > 0) {
      // Pass primary file for single-upload pipeline compatibility
      formData.append("file", selectedFiles[0])
    }

    dispatch(addMessage({ role: "user", content: promptText }))
    setValue("")
    setSelectedFiles([])

    const data = await sendMessage(formData)
    dispatch(setIsLoading(false))
    dispatch(setArtifacts(data.artifacts || []))
    dispatch(addMessage({ role: "assistant", content: data?.answer, images: data?.images }))
  }

  const agents = [
    { id: "auto", icon: Zap, label: "Auto" },
    { id: "swarm", icon: Users, label: "Team" },
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "coding", icon: Code2, label: "Coding" },
    { id: "pdf", icon: FileText, label: "PDF" },
    { id: "ppt", icon: Presentation, label: "PPT" },
    { id: "vision", icon: ImageIcon, label: "Vision" },
    { id: "search", icon: Globe, label: "Search" }
  ]

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className='w-full overflow-hidden px-3 md:px-5 py-3.5 border-t border-white/[0.06] bg-[#0d0f14] shrink-0'>
      <div className='flex flex-col gap-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 pt-3 pb-3'>

        {/* Agent Selector Bar */}
        <div className='flex w-full gap-2 pr-2 flex-wrap items-center justify-between'>
          <div className='flex gap-1.5 flex-wrap items-center'>
            {agents.map((agent) => {
              const isActive = selectedAgent === agent.label
              const Icon = agent.icon
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.label)}
                  className={`flex-shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_1px_8px_rgba(99,102,241,.35)]"
                      : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.07] hover:text-slate-200"
                  }`}
                >
                  <Icon size={13} className={isActive ? "text-white" : "text-slate-500"} />
                  <span>{agent.label}</span>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => setIsVoiceOpen(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 rounded-full transition cursor-pointer"
          >
            <Mic size={12} />
            <span>Live Voice</span>
          </button>
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className='flex flex-wrap gap-2 my-2'>
            {selectedFiles.map((file, idx) => (
              <div key={idx} className='inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs'>
                {file.type === "application/pdf" ? (
                  <FileText size={15} className="text-red-400 shrink-0" />
                ) : file.type.startsWith("image/") ? (
                  <img src={URL.createObjectURL(file)} alt="preview" className="h-6 w-6 rounded-lg object-cover" />
                ) : (
                  <Code2 size={15} className="text-indigo-400 shrink-0" />
                )}
                <span className='text-white max-w-[120px] truncate'>{file.name}</span>
                <span className='text-[10px] text-slate-500'>{Math.ceil(file.size / 1024)}KB</span>
                <button className='cursor-pointer text-slate-500 hover:text-white ml-1' onClick={() => removeFile(idx)}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea Input */}
        <textarea
          placeholder={selectedAgent === 'Team' ? 'Describe your project for the autonomous multi-agent swarm...' : 'Ask CortexAI anything... (Shift+Enter for new line)'}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage()
            }
          }}
          value={value}
          className="w-full bg-transparent outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-600 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50"
          rows={2}
        />

        {/* Bottom Actions */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-1.5'>
            <input
              type="file"
              multiple
              accept='.pdf,image/*,.txt,.csv,.json,.js,.py,.jsx,.tsx'
              hidden
              ref={fileRef}
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 0) {
                  setSelectedFiles(prev => [...prev, ...files])
                }
                e.target.value = ""
              }}
            />

            <button
              className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition bg-transparent cursor-pointer'
              onClick={() => fileRef.current.click()}
              title="Attach File (PDF, Image, Code, Text)"
            >
              <Paperclip size={16} />
            </button>

            <button
              onClick={handleOpenVoice}
              className='flex items-center justify-center w-8 h-8 rounded-lg text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition cursor-pointer'
              title="Open Voice Mode"
            >
              <Mic size={16} />
            </button>
          </div>

          <button
            disabled={!value.trim() && selectedFiles.length === 0 && isLoading}
            onClick={() => handleSendMessage()}
            className={`flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all duration-150 ${
              value.trim() || selectedFiles.length > 0
                ? "bg-gradient-to-br from-indigo-500 to-violet-700 hover:opacity-90 text-white shadow-md"
                : "bg-white/[0.05] text-slate-600 cursor-not-allowed"
            }`}
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* Voice Mode Modal */}
      <VoiceModeModal
        isOpen={isVoiceOpen}
        onClose={handleCloseVoice}
        onSendMessage={(spokenText) => {
          handleSendMessage(spokenText)
        }}
        isAiResponding={isLoading}
        latestAiMessage={latestAssistantMessage}
      />
    </div>
  )
}

export default ChatInput
