"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, RefreshCw } from "lucide-react";

interface Config {
  uiPort: number;
  ollamaBaseUrl: string;
  preferredModel: string;
}

export function Settings() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/config");
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Failed to fetch config:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!showSettings) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={() => setShowSettings(true)}
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Tidy AI Settings
          </CardTitle>
          <CardDescription>
            Configuration is managed via CLI. Use <code>tidyai config</code>{" "}
            command to change settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>UI Port</Label>
            <Input
              value={config?.uiPort || ""}
              disabled
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Change with:{" "}
              <code className="bg-slate-100 px-2 py-1 rounded">
                tidyai config set uiPort &lt;port&gt;
              </code>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ollama Base URL</Label>
            <Input
              value={config?.ollamaBaseUrl || ""}
              disabled
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Change with:{" "}
              <code className="bg-slate-100 px-2 py-1 rounded">
                tidyai config set ollamaBaseUrl &lt;url&gt;
              </code>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Preferred Model</Label>
            <Input
              value={config?.preferredModel || ""}
              disabled
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Change with:{" "}
              <code className="bg-slate-100 px-2 py-1 rounded">
                tidyai config set preferredModel &lt;model&gt;
              </code>
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <Badge variant="outline" className="font-normal">
              💡 Configuration File Location
            </Badge>
            <p className="text-sm text-muted-foreground">
              macOS/Linux:{" "}
              <code className="bg-slate-100 px-2 py-1 rounded">
                ~/.tidyai/config.json
              </code>
            </p>
            <p className="text-sm text-muted-foreground">
              Windows:{" "}
              <code className="bg-slate-100 px-2 py-1 rounded">
                %APPDATA%/tidyai/config.json
              </code>
            </p>
          </div>

          <div className="pt-4 flex gap-2">
            <Button onClick={fetchConfig} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setShowSettings(false)} className="ml-auto">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
