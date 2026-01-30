import { Bot, Sparkles } from "lucide-react";

const AIChatHelper = () => {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-3 mb-3 mx-3">
      <div className="flex items-start gap-3">
        <div className="bg-primary/20 rounded-full p-2">
          <Bot className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm flex items-center gap-1">
              <Sparkles className="size-4 text-primary" />
              AI Assistant Available
            </h3>
          </div>
          <p className="text-xs opacity-75">
            Type <span className="font-mono bg-base-200 px-1.5 py-0.5 rounded">@ai</span> followed by your question to get instant AI-powered answers!
          </p>
          <p className="text-xs opacity-60 mt-1">
            Example: <span className="italic">@ai What is the capital of France?</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatHelper;
