import { MessageCircle } from "lucide-react";

function Chatbot() {
  return (
   <div className="fixed bottom-4 right-4 z-5">
    <div className="relative">
        <span
          aria-label="Chat"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-emerald-700 shadow-xl"
        >
          <MessageCircle size={28} />
        </span>

        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
        5
        </span>
    </div>
    </div>


  )
}

export default Chatbot