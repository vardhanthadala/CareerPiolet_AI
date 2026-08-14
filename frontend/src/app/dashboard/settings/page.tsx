"use client";

import { UserCircle, Shield, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCircle className="h-6 w-6 text-blue-500" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your system preferences.
        </p>
      </div>

      <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            Authentication Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
            <div>
              <p className="font-semibold text-sm">Demo / Guest Access</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Auth screens are currently hidden. All features are open for testing.
              </p>
            </div>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
