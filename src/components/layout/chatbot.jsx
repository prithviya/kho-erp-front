import React from 'react'

function chatbot() {
  return (
   <div className="fixed bottom-4 right-4 z-5">
    <div className="relative">
        <img
        src="https://png.pngtree.com/png-vector/20230412/ourmid/pngtree-chat-flat-icon-vector-png-image_6701502.png"
        alt="Chat"
        className="w-14 h-14 rounded-full shadow-xl border border-slate-200 p-2 bg-white"
        />

        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
        5
        </span>
    </div>
    </div>


  )
}

export default chatbot