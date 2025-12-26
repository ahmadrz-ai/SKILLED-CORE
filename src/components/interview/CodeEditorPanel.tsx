'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Terminal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CodeEditorPanelProps {
    language?: string;
    onRun?: (code: string) => void;
}

const DEFAULT_CODE = `// Write a function to analyze the data structure
// Time Complexity Target: O(n)

function analyze(data) {
  // Your code here
  return data;
}

console.log(analyze([1, 2, 3]));`;

export function CodeEditorPanel({ language = 'javascript', onRun }: CodeEditorPanelProps) {
    const [code, setCode] = useState(DEFAULT_CODE);
    const [output, setOutput] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const handleRun = () => {
        setIsRunning(true);
        setOutput(['> Compiling...', '> Running...']);

        // Mock Execution
        setTimeout(() => {
            setIsRunning(false);
            const mockOutput = [
                '> Execution Time: 0.42ms',
                '> Result: [1, 2, 3]',
                '> Memory Usage: 4.2MB',
                '> Status: SUCCESS'
            ];
            setOutput(mockOutput);
            if (onRun) onRun(code);
            toast.success("Code Executed Successfully");
        }, 1500);
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 font-mono font-bold uppercase">{language.toUpperCase()}</span>
                    <span className="text-[10px] text-zinc-500">Monaco Editor</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setCode(DEFAULT_CODE)}
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-zinc-400 hover:text-white"
                    >
                        <RotateCcw className="w-3 h-3 mr-1" /> Reset
                    </Button>
                    <Button
                        onClick={handleRun}
                        disabled={isRunning}
                        size="sm"
                        className="h-7 bg-green-600 hover:bg-green-500 text-white font-mono text-xs"
                    >
                        <Play className="w-3 h-3 mr-1 fill-white" /> {isRunning ? 'Running...' : 'Run Code'}
                    </Button>
                </div>
            </div>

            {/* Split View: Editor & Terminal */}
            <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
                {/* Editor Area */}
                <div className="flex-1 min-h-[300px] border-r border-white/5">
                    <Editor
                        height="100%"
                        defaultLanguage={language}
                        defaultValue={DEFAULT_CODE}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontFamily: 'JetBrains Mono, Menlo, monospace',
                            fontSize: 13,
                        }}
                    />
                </div>

                {/* Terminal Pane */}
                <div className="lg:w-1/3 bg-[#0a0a0a] flex flex-col border-l border-white/10">
                    <div className="px-4 py-2 bg-[#1a1a1a] border-b border-white/5 flex items-center gap-2">
                        <Terminal className="w-3 h-3 text-zinc-400" />
                        <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Terminal</span>
                    </div>
                    <div className="flex-1 p-4 font-mono text-xs space-y-2 overflow-y-auto text-green-400/80">
                        {output.length === 0 && <span className="text-zinc-600 opacity-50">$ Ready for input...</span>}
                        {output.map((line, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="text-zinc-600 opacity-50">{i + 1}</span>
                                <span className={line.includes('Error') ? 'text-red-400' : ''}>{line}</span>
                            </div>
                        ))}
                        {isRunning && (
                            <div className="animate-pulse">_</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
