"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  FolderOpen,
  Loader2,
  FileText,
  Download,
} from "lucide-react";

interface FileOperation {
  src: string;
  dst: string;
  category: string;
  reason: string;
}

interface OrganizationPlan {
  source: string;
  dest: string;
  createdAt: string;
  count: number;
  operations: FileOperation[];
}

interface PlanResult {
  plan: OrganizationPlan;
  filesWritten: {
    planJson: string;
    planCsv: string;
    summaryTxt: string;
  };
  stats: {
    totalFiles: number;
    categoryCounts: Record<string, number>;
    unknownCount: number;
    duplicateCount: number;
  };
}

export default function HomePage() {
  const [sourceFolder, setSourceFolder] = useState("~/Downloads");
  const [destFolder, setDestFolder] = useState("~/Downloads/Organized");
  const [useOllama, setUseOllama] = useState(false);
  const [ollamaModel, setOllamaModel] = useState("llama3.1");
  const [detectDuplicates, setDetectDuplicates] = useState(false);

  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleScanAndGeneratePlan = async () => {
    setIsScanning(true);
    setError(null);
    setSuccess(null);
    setPlanResult(null);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceFolder,
          destFolder,
          useOllama,
          ollamaModel,
          detectDuplicates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate plan");
      }

      const result: PlanResult = await response.json();
      setPlanResult(result);
      setSuccess(
        `Plan generated successfully! Found ${result.stats.totalFiles} files to organize.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyPlan = async () => {
    if (!planResult) return;

    setShowConfirmDialog(false);
    setIsApplying(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planResult.plan }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to apply plan");
      }

      const result = await response.json();
      setSuccess(
        `Successfully moved ${result.result.appliedCount} files! ${
          result.result.errors.length > 0
            ? `${result.result.errors.length} errors occurred.`
            : ""
        }`
      );
      setPlanResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsApplying(false);
    }
  };

  const filteredOperations = planResult?.plan.operations.filter((op) => {
    const matchesSearch =
      searchQuery === "" ||
      op.src.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.dst.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || op.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = planResult
    ? ["all", ...Object.keys(planResult.stats.categoryCounts).sort()]
    : ["all"];

  const handleExportPlan = () => {
    if (!planResult) return;

    const dataStr = JSON.stringify(planResult.plan, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plan.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            AI File Management
          </h1>
          <p className="text-gray-600">
            Organize your Downloads folder with safe plan-then-apply workflow
          </p>
        </div>

        {/* Warning Banner */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Dry Run Mode by Default</AlertTitle>
          <AlertDescription>
            Clicking &quot;Scan & Generate Plan&quot; only creates a plan. Files
            will only be moved when you click &quot;Apply Plan&quot; and
            confirm. The scan will recursively find all files in subfolders.
          </AlertDescription>
        </Alert>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Set up your file organization preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source Folder</Label>
                <Input
                  id="source"
                  value={sourceFolder}
                  onChange={(e) => setSourceFolder(e.target.value)}
                  placeholder="~/Downloads"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dest">Destination Folder</Label>
                <Input
                  id="dest"
                  value={destFolder}
                  onChange={(e) => setDestFolder(e.target.value)}
                  placeholder="~/Downloads/Organized"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ollama">Use Ollama for unknown files</Label>
                <p className="text-sm text-muted-foreground">
                  AI categorization for files with unknown extensions
                </p>
              </div>
              <Switch
                id="ollama"
                checked={useOllama}
                onCheckedChange={setUseOllama}
              />
            </div>

            {useOllama && (
              <div className="space-y-2">
                <Label htmlFor="model">Ollama Model</Label>
                <Input
                  id="model"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="llama3.1"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="duplicates">Detect duplicates</Label>
                <p className="text-sm text-muted-foreground">
                  Identify duplicate files by size and hash
                </p>
              </div>
              <Switch
                id="duplicates"
                checked={detectDuplicates}
                onCheckedChange={setDetectDuplicates}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleScanAndGeneratePlan}
                disabled={isScanning}
                className="flex-1"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Scan & Generate Plan
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={!planResult || isApplying}
                variant="destructive"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  "Apply Plan"
                )}
              </Button>
              {planResult && (
                <Button onClick={handleExportPlan} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        {planResult && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Total Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {planResult.stats.totalFiles}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(planResult.stats.categoryCounts).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Unknown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {planResult.stats.unknownCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Duplicates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {planResult.stats.duplicateCount}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Operations Table */}
        {planResult && (
          <Card>
            <CardHeader>
              <CardTitle>Operations Preview</CardTitle>
              <CardDescription>
                {filteredOperations?.length} operations shown
              </CardDescription>
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat === "all" ? "All Categories" : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperations?.map((op, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs max-w-xs truncate">
                        {op.src}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-xs truncate">
                        {op.dst}
                      </TableCell>
                      <TableCell>
                        <Badge>{op.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {op.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will move {planResult?.stats.totalFiles} files from your
                Downloads folder to the organized structure. This action cannot
                be undone easily.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApplyPlan}>
                Confirm & Apply
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
