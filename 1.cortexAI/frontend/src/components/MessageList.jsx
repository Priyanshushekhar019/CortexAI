import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import MessageBubble from './MessageBubble'
import LoadingAnimation from './LoadingAnimation'
import { ArrowDown } from 'lucide-react'

function MessageList() {
    const { selectedConversation } = useSelector(state => state.conversation)
    const { messages, isLoading } = useSelector(state => state.message)
    const containerRef = useRef(null)
    const bottomRef = useRef(null)
    const [showScrollBottom, setShowScrollBottom] = useState(false)

    const scrollToBottom = useCallback((behavior = "smooth") => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior, block: "end" })
        }
    }, [])

    const handleScroll = useCallback(() => {
        const container = containerRef.current
        if (!container) return
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
        setShowScrollBottom(distanceFromBottom > 150)
    }, [])

    useEffect(() => {
        // Immediate scroll
        scrollToBottom("smooth")

        // Secondary delayed scroll to account for code syntax highlight and media layout expansions
        const timer = setTimeout(() => {
            scrollToBottom("smooth")
        }, 150)

        return () => clearTimeout(timer)
    }, [messages, isLoading, selectedConversation?._id, scrollToBottom])

    return (
        <div 
            ref={containerRef}
            onScroll={handleScroll}
            className='relative flex-1 overflow-y-auto px-6 py-6 space-y-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        >
            {messages.length === 0 || !selectedConversation ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                    <div className='flex flex-col gap-1.5'>
                        <h1 className='text-[20px] font-semibold text-slate-200 tracking-tight'>CortexAI</h1>
                        <p className='text-[15px] font-semibold text-slate-400 tracking-tight'>How can I help you?</p>
                        <p className='text-[13px] text-slate-600 max-w-[260px] leading-relaxed'>Ask me anything — code, ideas, explanations, or just a quick question.</p>
                    </div>
                    <div className='flex flex-wrap justify-center gap-2 mt-1'>
                        {["Write a Netflix clone", "Explain Redis", "Build a dashboard"].map((s) => (
                            <button key={s} className='text-[12px] text-slate-400 bg-white/[0.04] border border-white/[0.07] px-3.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-slate-200 transition-colors duration-150 cursor-pointer'>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className='space-y-5'>
                    {messages?.map((msg, i) => (
                        <div key={msg._id || i}>
                            <MessageBubble 
                                role={msg?.role} 
                                content={msg?.content} 
                                images={msg.images || []} 
                                artifacts={msg.artifacts || []} 
                            /> 
                        </div>
                    ))}

                    {isLoading && <LoadingAnimation />}
                </div>
            )}
            
            <div ref={bottomRef} className="h-px" />

            {/* Floating Jump to Latest Button */}
            {showScrollBottom && (
                <button
                    onClick={() => scrollToBottom("smooth")}
                    className="fixed bottom-24 right-8 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/30 backdrop-blur-sm border border-indigo-400/20 transition-all duration-200 cursor-pointer"
                    title="Scroll to latest messages"
                >
                    <ArrowDown size={14} />
                    <span>Latest</span>
                </button>
            )}
        </div>
    )
}

export default MessageList
