'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { createPhoneIssue, updatePhoneIssue } from '@/app/admin-hunnu/phone-issues/actions';
import { PhoneIssue, PhoneIssueFormData } from '@/types/admin';

interface ApartmentForSelect {
    id: string;
    unit_number: string;
    floor: number;
    building_id: string;
    building: any; // Supabase returns this as array, we'll handle it in the component
}

interface WorkerForSelect {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

interface PhoneIssueFormProps {
    phoneIssue?: PhoneIssue;
    apartments: ApartmentForSelect[];
    workers: WorkerForSelect[];
}

export function PhoneIssueForm({ phoneIssue, apartments, workers }: PhoneIssueFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<PhoneIssueFormData>({
        apartment_id: phoneIssue?.apartment_id || '',
        phone_number: phoneIssue?.phone_number || '',
        issue_type: phoneIssue?.issue_type || 'smoke_detector',
        status: phoneIssue?.status || 'open',
        worker_id: phoneIssue?.worker_id || '',
        description: phoneIssue?.description || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (phoneIssue) {
                await updatePhoneIssue(phoneIssue.id, formData);
                toast({
                    title: 'Success',
                    description: 'Phone issue updated successfully'
                });
            } else {
                await createPhoneIssue(formData);
                toast({
                    title: 'Success',
                    description: 'Phone issue created successfully'
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Something went wrong',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/admin-hunnu/phone-issues');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="apartment_id">Apartment *</Label>
                    <Select
                        value={formData.apartment_id}
                        onValueChange={(value) => setFormData({ ...formData, apartment_id: value })}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select apartment" />
                        </SelectTrigger>
                        <SelectContent>
                            {apartments.map((apartment) => {
                                const building = Array.isArray(apartment.building) ? apartment.building[0] : apartment.building;
                                return (
                                    <SelectItem key={apartment.id} value={apartment.id}>
                                        Unit {apartment.unit_number} - Floor {apartment.floor}
                                        {building && ` - ${building.name}`}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number *</Label>
                    <Input
                        id="phone_number"
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+1234567890"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="issue_type">Issue Type *</Label>
                    <Select
                        value={formData.issue_type}
                        onValueChange={(value: 'smoke_detector' | 'domophone' | 'light_bulb') =>
                            setFormData({ ...formData, issue_type: value })
                        }
                        required
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="smoke_detector">Smoke Detector</SelectItem>
                            <SelectItem value="domophone">Domophone</SelectItem>
                            <SelectItem value="light_bulb">Light Bulb</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value: 'open' | 'in_progress' | 'resolved') =>
                            setFormData({ ...formData, status: value })
                        }
                        required
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="worker_id">Assigned Worker</Label>
                    <Select
                        value={formData.worker_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, worker_id: value === "none" ? "" : value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select worker (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No worker assigned</SelectItem>
                            {workers.map((worker) => (
                                <SelectItem key={worker.id} value={worker.id}>
                                    {worker.name}
                                    {worker.email && ` (${worker.email})`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                />
            </div>

            <div className="flex items-center gap-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : phoneIssue ? 'Update Phone Issue' : 'Create Phone Issue'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}