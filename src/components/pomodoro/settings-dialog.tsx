"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: {
    workDuration: number;
    breakDuration: number;
  };
  onSave: (newSettings: { workDuration: number; breakDuration: number }) => void;
}

const secondsToHms = (d: number) => {
    d = Number(d);
    const h = Math.floor(d / 3600);
    const m = Math.floor(d % 3600 / 60);
    const s = Math.floor(d % 3600 % 60);
    return { h, m, s };
}

const hmsToSeconds = ({ h, m, s }: { h: number, m: number, s: number }) => {
    return h * 3600 + m * 60 + s;
}

export default function SettingsDialog({ open, onOpenChange, settings, onSave }: SettingsDialogProps) {
  const [workTime, setWorkTime] = useState({h: 0, m: 0, s: 0});
  const [breakTime, setBreakTime] = useState({h: 0, m: 0, s: 0});

  useEffect(() => {
    if (open) {
        setWorkTime(secondsToHms(settings.workDuration));
        setBreakTime(secondsToHms(settings.breakDuration));
    }
  }, [open, settings]);
  

  const handleSave = () => {
    onSave({
        workDuration: hmsToSeconds(workTime),
        breakDuration: hmsToSeconds(breakTime)
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Timer Settings</DialogTitle>
          <DialogDescription>
            Customize your Pomodoro session durations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label className="font-medium">Work Duration</Label>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <Label htmlFor="work-h" className="text-xs text-muted-foreground">Hours</Label>
                    <Input id="work-h" type="number" value={workTime.h} onChange={e => setWorkTime(wt => ({...wt, h: parseInt(e.target.value) || 0}))} min="0" />
                </div>
                <div>
                    <Label htmlFor="work-m" className="text-xs text-muted-foreground">Minutes</Label>
                    <Input id="work-m" type="number" value={workTime.m} onChange={e => setWorkTime(wt => ({...wt, m: parseInt(e.target.value) || 0}))} min="0" />
                </div>
                <div>
                    <Label htmlFor="work-s" className="text-xs text-muted-foreground">Seconds</Label>
                    <Input id="work-s" type="number" value={workTime.s} onChange={e => setWorkTime(wt => ({...wt, s: parseInt(e.target.value) || 0}))} min="0" />
                </div>
            </div>
          </div>
           <div className="space-y-2">
            <Label className="font-medium">Break Duration</Label>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <Label htmlFor="break-h" className="text-xs text-muted-foreground">Hours</Label>
                    <Input id="break-h" type="number" value={breakTime.h} onChange={e => setBreakTime(bt => ({...bt, h: parseInt(e.target.value) || 0}))} min="0" />
                </div>
                <div>
                    <Label htmlFor="break-m" className="text-xs text-muted-foreground">Minutes</Label>
                    <Input id="break-m" type="number" value={breakTime.m} onChange={e => setBreakTime(bt => ({...bt, m: parseInt(e.target.value) || 0}))} min="0" />
                </div>
                <div>
                    <Label htmlFor="break-s" className="text-xs text-muted-foreground">Seconds</Label>
                    <Input id="break-s" type="number" value={breakTime.s} onChange={e => setBreakTime(bt => ({...bt, s: parseInt(e.target.value) || 0}))} min="0" />
                </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    