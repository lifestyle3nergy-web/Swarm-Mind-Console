import React, { useState, KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useRunTask,
  useGetMemory,
  useClearMemory,
  useGetStats,
  getGetMemoryQueryKey,
  getGetStatsQueryKey,
} from "@workspace/api-client-react";
import type { RunResponse, MemoryEntry, SwarmResult } from "@workspace/api-client-react/src/generated/api.schemas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Terminal, Database, Activity, Cpu, Trash2, Clock, Zap, Network } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const queryClient = useQueryClient();
  const runTask = useRunTask();
  const clearMemory = useClearMemory();
  
  const { data: statsData } = useGetStats({
    query: { refetchInterval: 2000 }
  });
  
  const { data: memoryData } = useGetMemory({
    query: { refetchInterval: 2000 }
  });

  const [input, setInput] = useState("");
  const [lastOutput, setLastOutput] = useState<RunResponse | null>(null);

  const handleRun = () => {
    if (!input.trim() || runTask.isPending) return;
    runTask.mutate(
      { data: { input } },
      {
        onSuccess: (data) => {
          setLastOutput(data);
          setInput("");
          queryClient.invalidateQueries({ queryKey: getGetMemoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        },
      }
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleRun();
    }
  };

  const handleClearMemory = () => {
    clearMemory.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMemoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      }
    });
  };

  const isSwarmResult = (result: unknown): result is SwarmResult => {
    return typeof result === 'object' && result !== null && 'swarm' in result && 'workers' in result;
  };

  const formatJson = (obj: any) => {
    const jsonStr = JSON.stringify(obj, null, 2);
    return jsonStr.split('\n').map((line, i) => {
      let styledLine = line
        .replace(/"([^"]+)":/g, '<span class="text-primary/80">"$1"</span>:')
        .replace(/: "([^"]+)"/g, ': <span class="text-emerald-300">"$1"</span>')
        .replace(/: (true|false|null)/g, ': <span class="text-cyan-400">$1</span>')
        .replace(/: (\d+)/g, ': <span class="text-purple-400">$1</span>');
      return (
        <div key={i} className="table-row">
          <span className="table-cell text-muted-foreground/30 pr-4 select-none text-right w-8">{i + 1}</span>
          <span className="table-cell whitespace-pre-wrap" dangerouslySetContent={{__html: styledLine}} />
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <div className="scanline" />
      
      <header className="border-b border-border/50 bg-background/95 backdrop-blur z-10 sticky top-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-sm bg-primary/20 border border-primary flex items-center justify-center animate-pulse">
            <Cpu className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-primary tracking-widest glow-text">NETWORX_AIM_OS</h1>
            <p className="text-xs text-muted-foreground tracking-widest">SWARM ORCHESTRATION CONSOLE v1.0.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-primary uppercase tracking-wider">SYSTEM ONLINE</span>
          </div>
          <div className="h-4 w-px bg-border"></div>
          <span className="text-muted-foreground font-mono">
            UPTIME: {statsData ? formatDistanceToNow(Date.now() - statsData.uptimeMs) : "CALCULATING..."}
          </span>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <Tabs defaultValue="console" className="w-full">
          <TabsList className="mb-8 bg-muted/30 border border-border rounded-none p-1">
            <TabsTrigger value="console" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent transition-all uppercase tracking-wider">
              <Terminal className="h-4 w-4 mr-2" /> Terminal
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent transition-all uppercase tracking-wider">
              <Activity className="h-4 w-4 mr-2" /> Telemetry
            </TabsTrigger>
            <TabsTrigger value="memory" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent transition-all uppercase tracking-wider">
              <Database className="h-4 w-4 mr-2" /> Memory Core
            </TabsTrigger>
          </TabsList>

          <TabsContent value="console" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 rounded-sm bg-card/50 backdrop-blur">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="text-primary/50">&gt;</span> COMMAND_INPUT
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-4">
                <div className="relative">
                  <Textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter objective for AI swarm... (Ctrl+Enter to execute)"
                    className="min-h-[120px] font-mono text-sm bg-background border-border focus-visible:ring-primary/50 resize-none rounded-none placeholder:text-muted-foreground/50"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden sm:inline-block">CTRL+ENTER</span>
                    <Button 
                      onClick={handleRun}
                      disabled={!input.trim() || runTask.isPending}
                      className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest text-xs h-8"
                    >
                      {runTask.isPending ? "EXECUTING..." : "EXECUTE"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(lastOutput || runTask.isPending) && (
              <Card className="border-border/50 rounded-sm bg-black/60 shadow-lg">
                <CardHeader className="border-b border-border/50 py-3 bg-muted/20 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="text-primary animate-pulse">■</span> EXECUTION_OUTPUT
                  </CardTitle>
                  {lastOutput && (
                    <div className="flex gap-3">
                      <Badge variant="outline" className="rounded-none border-primary/30 text-primary bg-primary/5">
                        <Clock className="h-3 w-3 mr-1" /> {lastOutput.executionMs}ms
                      </Badge>
                      <Badge variant="outline" className="rounded-none border-primary/30 text-primary bg-primary/5">
                        <Zap className="h-3 w-3 mr-1" /> TOKENS: {lastOutput.tokenAllowed ? 'OK' : 'LIMIT'}
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {runTask.isPending ? (
                    <div className="p-8 text-center space-y-4">
                      <div className="inline-block relative">
                        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <div className="w-12 h-12 border-2 border-primary/30 border-b-transparent rounded-full animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                      </div>
                      <p className="text-primary text-sm animate-pulse tracking-widest">ANALYZING & ROUTING TASKS...</p>
                    </div>
                  ) : lastOutput ? (
                    <div className="divide-y divide-border/30">
                      {lastOutput.plan.swarm && isSwarmResult(lastOutput.result) && (
                        <div className="p-4 bg-primary/5">
                          <h4 className="text-xs uppercase text-primary/70 mb-3 flex items-center gap-2">
                            <Network className="h-4 w-4" /> Swarm Activation ({lastOutput.result.workers.length} Workers)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {lastOutput.result.workers.map((worker, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 border border-primary/20 bg-background/50 rounded-sm">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_5px_rgba(0,255,100,0.5)]"></div>
                                <span className="text-xs text-primary/90 truncate">{worker}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="p-4 overflow-x-auto">
                        <div className="table w-full text-sm font-mono leading-relaxed">
                          {formatJson(lastOutput)}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stats" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-border/50 rounded-sm bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground tracking-widest uppercase">Total Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">{statsData?.totalTasks ?? '--'}</div>
                </CardContent>
              </Card>

              <Card className="border-border/50 rounded-sm bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground tracking-widest uppercase">Swarm Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">{statsData ? `${(statsData.swarmRatio * 100).toFixed(1)}%` : '--'}</div>
                  <Progress value={statsData ? statsData.swarmRatio * 100 : 0} className="h-1 mt-3 bg-muted" indicatorClassName="bg-primary" />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                    <span>SINGLE: {statsData?.singleTasks ?? 0}</span>
                    <span>SWARM: {statsData?.swarmTasks ?? 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 rounded-sm bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground tracking-widest uppercase">Memory Core Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">{statsData?.memorySize ?? '--'}</div>
                  <div className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">Active Entries</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="memory" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm text-primary tracking-widest uppercase">Memory Index [{memoryData?.count ?? 0} Entries]</h3>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="rounded-none border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive h-8 text-xs tracking-widest uppercase">
                    <Trash2 className="h-3 w-3 mr-2" /> Purge Core
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-destructive/50 bg-background rounded-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive uppercase tracking-widest font-mono">Confirm Memory Purge</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground font-mono">
                      Warning: This will permanently erase all memory vectors from the system. The swarm will lose all context of previous tasks.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-none border-border bg-transparent text-foreground hover:bg-muted font-mono uppercase tracking-widest text-xs">Abort</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearMemory} className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono uppercase tracking-widest text-xs">
                      Execute Purge
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="space-y-2">
              {memoryData?.entries.length === 0 ? (
                <div className="border border-border/50 border-dashed p-12 text-center text-muted-foreground">
                  <Database className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm tracking-widest uppercase">Memory core is empty</p>
                </div>
              ) : (
                memoryData?.entries.map((entry, i) => (
                  <Card key={i} className="border-border/30 rounded-none bg-black/40 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-start mb-4">
                        <div className="space-y-1">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                            {new Date(entry.timestamp).toLocaleString()} ({formatDistanceToNow(entry.timestamp, { addSuffix: true })})
                          </div>
                          <h4 className="text-sm text-foreground break-words">{entry.input}</h4>
                        </div>
                        <div className="w-full sm:w-32 shrink-0">
                          <div className="flex justify-between text-[10px] text-primary/70 mb-1 uppercase tracking-widest">
                            <span>Strength</span>
                            <span>{Math.round(entry.strength * 100)}%</span>
                          </div>
                          <Progress value={entry.strength * 100} className="h-1 bg-primary/10" indicatorClassName="bg-primary" />
                        </div>
                      </div>
                      <div className="bg-muted/20 p-3 text-xs text-muted-foreground border-l-2 border-primary/30">
                        {entry.output}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
