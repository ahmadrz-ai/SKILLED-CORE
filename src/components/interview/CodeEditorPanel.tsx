'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Terminal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CodeEditorPanelProps {
    language?: string;
    code?: string;
    onChange?: (code: string) => void;
    output?: string[];
    onRun?: (code: string, output: string[]) => void;
}

const DEFAULT_CODE = `// Write a function to analyze the data structure
// Time Complexity Target: O(n)

function analyze(data) {
  // Your code here
  return data;
}

console.log(analyze([1, 2, 3]));`;

export function CodeEditorPanel({ 
    language = 'javascript', 
    code: externalCode, 
    onChange: onExternalChange, 
    output: externalOutput, 
    onRun 
}: CodeEditorPanelProps) {
    const [localCode, setLocalCode] = useState(externalCode !== undefined ? externalCode : DEFAULT_CODE);
    const [localOutput, setLocalOutput] = useState<string[]>(externalOutput !== undefined ? externalOutput : []);
    const [isRunning, setIsRunning] = useState(false);

    // Sync external changes
    useEffect(() => {
        if (externalCode !== undefined) {
            setLocalCode(externalCode);
        }
    }, [externalCode]);

    useEffect(() => {
        if (externalOutput !== undefined) {
            setLocalOutput(externalOutput);
        }
    }, [externalOutput]);

    const handleCodeChange = (newVal: string) => {
        setLocalCode(newVal);
        if (onExternalChange) {
            onExternalChange(newVal);
        }
    };

    const handleRun = () => {
        setIsRunning(true);
        const tempOut = ['> Compiling...', '> Running...'];
        setLocalOutput(tempOut);
        if (onExternalChange && externalOutput !== undefined) {
            // Keep output in sync
        }

        // Mock Execution
        setTimeout(() => {
            setIsRunning(false);
            const mockOutput = [
                '> Execution Time: 0.42ms',
                '> Result: [1, 2, 3]',
                '> Memory Usage: 4.2MB',
                '> Status: SUCCESS'
            ];
            setLocalOutput(mockOutput);
            if (onRun) onRun(localCode, mockOutput);
            toast.success("Code Executed Successfully");
        }, 1500);
    };

    return (
        <div className="h-full flex flex-col bg-[#16161f] rounded-2xl overflow-hidden border border-[#2a2a3a] shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 font-mono font-bold uppercase">{language.toUpperCase()}</span>
                    <span className="text-[10px] text-zinc-500">Monaco Editor</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => handleCodeChange(DEFAULT_CODE)}
                        size="sm"
                        className="h-7 text-xs text-white hover:bg-white/10 bg-transparent border border-zinc-700 rounded-lg shadow-none cursor-pointer focus-visible:ring-0 px-3"
                    >
                        <RotateCcw className="w-3 h-3 mr-1" /> Reset
                    </Button>
                    <Button
                        onClick={handleRun}
                        disabled={isRunning}
                        size="sm"
                        className="h-7 bg-green-600 hover:bg-green-500 text-white font-mono text-xs cursor-pointer"
                    >
                        <Play className="w-3 h-3 mr-1 fill-white" /> {isRunning ? 'Running...' : 'Run Code'}
                    </Button>
                </div>
            </div>

            {/* Split View: Editor & Terminal */}
            <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
                {/* Editor Area */}
                <div 
                    onCopy={(e) => {
                        e.preventDefault();
                        toast.error("Copying is disabled inside the sandbox.");
                    }}
                    onPaste={(e) => {
                        e.preventDefault();
                        toast.error("Pasting is disabled inside the sandbox.");
                    }}
                    className="flex-1 min-h-[300px] border-r border-[#2a2a3a]"
                >
                    <Editor
                        height="100%"
                        defaultLanguage={language}
                        defaultValue={DEFAULT_CODE}
                        value={localCode}
                        onChange={(value) => handleCodeChange(value || '')}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontFamily: 'JetBrains Mono, Menlo, monospace',
                            fontSize: 13,
                        }}
                    />
                </div>

                {/* Terminal Pane */}
                <div className="lg:w-1/3 bg-[#0a0a0a] flex flex-col border-l border-[#2a2a3a]">
                    <div className="px-4 py-2 bg-[#1a1a1a] border-b border-white/5 flex items-center gap-2">
                        <Terminal className="w-3 h-3 text-zinc-400" />
                        <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Terminal</span>
                    </div>
                    <div className="flex-1 p-4 font-mono text-xs space-y-2 overflow-y-auto text-green-400/80">
                        {localOutput.length === 0 && <span className="text-zinc-655 opacity-50">$ Ready for input...</span>}
                        {localOutput.map((line, i) => (
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
