import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { PhoneIssueForm } from '@/components/admin/phone-issue-form';
import { getApartmentsForSelect, getWorkersForSelect, getBuildingsForSelect } from '../actions';

function LoadingSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

async function NewPhoneIssueForm() {
    const [apartments, workers, buildings] = await Promise.all([
        getApartmentsForSelect(),
        getWorkersForSelect(),
        getBuildingsForSelect()
    ]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Phone Issue</CardTitle>
                <CardDescription>
                    Add a new phone issue record to track maintenance requests
                </CardDescription>
            </CardHeader>
            <CardContent>
                <PhoneIssueForm apartments={apartments} workers={workers} buildings={buildings} />
            </CardContent>
        </Card>
    );
}

export default function NewPhoneIssuePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin-hunnu/phone-issues">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Phone Issues
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Phone Issue</h1>
                    <p className="text-muted-foreground">
                        Create a new phone issue record for tracking and resolution
                    </p>
                </div>
            </div>

            <Suspense fallback={<LoadingSkeleton />}>
                <NewPhoneIssueForm />
            </Suspense>
        </div>
    );
}