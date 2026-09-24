import React, { useEffect, useState } from 'react'
import Nav from './Nav'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import CanvasBoard from './CanvasBoard'
import { useDispatch, useSelector } from 'react-redux'
import getMessages from '../features/getMessages'
import { setArtifacts, setMessages } from '../redux/messageSlice'
import VoiceModeModal from './VoiceModeModal'
import { extractCodeArtifacts } from '../utils/extractCodeArtifacts'

function ChatArea() {
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages, isLoading } = useSelector(state => state.message)
  const [viewMode, setViewMode] = useState('chat') // 'chat' or 'canvas'
  const [isNavVoiceOpen, setIsNavVoiceOpen] = useState(false)
  const dispatch = useDispatch()

  const latestAssistantMessage = messages
    ?.filter(m => m.role === "assistant")
    ?.slice(-1)[0]?.content || ""

  useEffect(() => {
    const getMesg = async () => {
      if (selectedConversation) {
        if (selectedConversation.title === "New Chat") {
          dispatch(setMessages([]))
          dispatch(setArtifacts([]))
          return;
        }
        const data = await getMessages(selectedConversation?._id)
        dispatch(setMessages(data || []))
        const latestArtifactMessage = [...(data || [])].reverse().find(msg => msg.artifacts && msg.artifacts.length > 0)
        if (latestArtifactMessage?.artifacts?.length > 0) {
          dispatch(setArtifacts(latestArtifactMessage.artifacts))
        } else {
          const latestCodeMessage = [...(data || [])].reverse().find(msg => msg.role === 'assistant' && msg.content && msg.content.includes('```'))
          if (latestCodeMessage) {
            const extracted = extractCodeArtifacts(latestCodeMessage.content)
            if (extracted) dispatch(setArtifacts(extracted))
            else dispatch(setArtifacts([]))
          } else {
            dispatch(setArtifacts([]))
          }
        }
      } else {
        dispatch(setMessages([]))
        dispatch(setArtifacts([]))
      }
    }

    getMesg()
  }, [selectedConversation?._id])

  return (
    <div className='flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0d0f14]'>
      <Nav
        viewMode={viewMode}
        onViewChange={setViewMode}
        onOpenVoiceMode={() => setIsNavVoiceOpen(true)}
      />

      {viewMode === 'canvas' ? (
        <CanvasBoard conversationId={selectedConversation?._id} />
      ) : (
        <>
          <MessageList />
          <ChatInput 
            isVoiceModalOpen={isNavVoiceOpen}
            onOpenVoiceModal={() => setIsNavVoiceOpen(true)}
            onCloseVoiceModal={() => setIsNavVoiceOpen(false)}
          />
        </>
      )}
    </div>
  )
}

export default ChatArea
