# useRealtimeReports Hook

A React hook that provides real-time updates for reports using Supabase's realtime functionality. This hook automatically subscribes to changes in the reports table and keeps your component's state synchronized with the database.

## Features

- 🔄 **Real-time synchronization** with the reports table
- 📡 **Automatic subscription management** with connection status tracking
- 🎯 **Event callbacks** for insert, update, and delete operations
- ⚡ **Optimistic updates** for better user experience
- 🛡️ **Error handling** with proper error states
- 🔧 **Manual control** over subscription lifecycle
- 📱 **Loading states** for better UX

## Installation

The hook is automatically exported from the main library:

```typescript
import { useRealtimeReports } from 'your-dispatch-lib';
```

## Basic Usage

```typescript
import React from 'react';
import { useRealtimeReports } from 'your-dispatch-lib';

function ReportsList() {
  const { reports, loading, error, isConnected } = useRealtimeReports();

  if (loading) return <div>Loading reports...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div>Connection: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      <div>Reports: {reports.length}</div>
      {reports.map(report => (
        <div key={report.id}>
          <h3>{report.incident_title}</h3>
          <p>Status: {report.status}</p>
          <p>Created: {new Date(report.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
```

## Advanced Usage with Callbacks

```typescript
import React, { useState } from 'react';
import { useRealtimeReports } from 'your-dispatch-lib';
import type { Database } from 'your-dispatch-lib';

type Report = Database["public"]["Tables"]["reports"]["Row"];

function ReportsDashboard() {
  const [notifications, setNotifications] = useState<string[]>([]);

  const { 
    reports, 
    loading, 
    error, 
    isConnected,
    subscribe,
    unsubscribe 
  } = useRealtimeReports({
    enabled: true,
    onInsert: (newReport: Report) => {
      console.log('New report added:', newReport);
      setNotifications(prev => [
        ...prev,
        `New report: ${newReport.incident_title || 'Untitled'}`
      ]);
      
      // Show toast notification
      showToast(`New report "${newReport.incident_title}" has been added`);
    },
    onUpdate: (updatedReport: Report) => {
      console.log('Report updated:', updatedReport);
      setNotifications(prev => [
        ...prev,
        `Report updated: ${updatedReport.incident_title || 'Untitled'}`
      ]);
    },
    onDelete: (reportId: number) => {
      console.log('Report deleted:', reportId);
      setNotifications(prev => [
        ...prev,
        `Report #${reportId} has been deleted`
      ]);
    }
  });

  const handleToggleSubscription = () => {
    if (isConnected) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  return (
    <div>
      <div className="status-bar">
        <span>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</span>
        <button onClick={handleToggleSubscription}>
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {loading && <div>Loading reports...</div>}
      {error && <div className="error">Error: {error}</div>}

      <div className="reports-grid">
        {reports.map(report => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>

      <div className="notifications">
        <h4>Recent Activity</h4>
        {notifications.map((notification, index) => (
          <div key={index} className="notification">
            {notification}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Conditional Subscriptions

You can conditionally enable/disable the subscription based on user preferences or component state:

```typescript
function ConditionalReports({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const shouldSubscribe = isAdmin && userId; // Only subscribe if user is admin and logged in

  const { reports, loading, error } = useRealtimeReports({
    enabled: shouldSubscribe,
    onInsert: (newReport) => {
      if (isAdmin) {
        // Only show notifications for admins
        showAdminNotification(newReport);
      }
    }
  });

  return (
    <div>
      {!shouldSubscribe && (
        <div>Realtime updates disabled for your role</div>
      )}
      {/* Render reports */}
    </div>
  );
}
```

## Manual Subscription Control

For more control over when the subscription is active:

```typescript
function ManualControlReports() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const { 
    reports, 
    loading, 
    error, 
    isConnected,
    subscribe,
    unsubscribe 
  } = useRealtimeReports({
    enabled: false, // Start with subscription disabled
  });

  const handleSubscribe = () => {
    subscribe();
    setIsSubscribed(true);
  };

  const handleUnsubscribe = () => {
    unsubscribe();
    setIsSubscribed(false);
  };

  return (
    <div>
      <div className="controls">
        <button 
          onClick={handleSubscribe}
          disabled={isConnected}
        >
          Start Realtime Updates
        </button>
        <button 
          onClick={handleUnsubscribe}
          disabled={!isConnected}
        >
          Stop Realtime Updates
        </button>
      </div>

      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {/* Render reports */}
    </div>
  );
}
```

## API Reference

### Hook Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Whether to enable the realtime subscription |
| `onInsert` | `(report: Report) => void` | `undefined` | Callback fired when a new report is inserted |
| `onUpdate` | `(report: Report) => void` | `undefined` | Callback fired when a report is updated |
| `onDelete` | `(reportId: number) => void` | `undefined` | Callback fired when a report is deleted |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `reports` | `Report[]` | Array of current reports from the database |
| `loading` | `boolean` | Whether the initial data fetch is in progress |
| `error` | `string \| null` | Error message if something went wrong |
| `isConnected` | `boolean` | Whether the realtime connection is active |
| `subscribe` | `() => void` | Function to manually start the subscription |
| `unsubscribe` | `() => void` | Function to manually stop the subscription |

### Report Type

The `Report` type is automatically inferred from your database schema:

```typescript
type Report = {
  id: number;
  incident_title: string | null;
  incident_date: string | null;
  incident_time: string | null;
  status: string;
  reporter_id: string;
  category_id: number | null;
  sub_category: number | null;
  what_happened: string | null;
  who_was_involved: string | null;
  suspect_description: string | null;
  injuries_reported: string | null;
  property_damage: string | null;
  number_of_witnesses: string | null;
  witness_contact_info: string | null;
  street_address: string | null;
  latitude: number;
  longitude: number;
  nearby_landmark: string | null;
  attachments: string[] | null;
  is_archived: boolean | null;
  resolved_at: string | null;
  created_at: string;
};
```

## Error Handling

The hook provides comprehensive error handling:

```typescript
function ErrorHandlingExample() {
  const { reports, loading, error, isConnected } = useRealtimeReports({
    onInsert: (report) => {
      console.log('New report:', report);
    }
  });

  if (loading) {
    return <div>Loading reports...</div>;
  }

  if (error) {
    return (
      <div className="error-state">
        <h3>Failed to load reports</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="warning-state">
        <p>⚠️ Realtime connection lost. Data may not be up to date.</p>
        {/* Your reports will still be displayed */}
      </div>
    );
  }

  return (
    <div>
      {/* Render your reports */}
    </div>
  );
}
```

## Performance Considerations

- The hook automatically manages subscription lifecycle and cleans up on unmount
- Initial data is fetched only once when the hook is first enabled
- Realtime updates are applied optimistically for better performance
- Consider using `enabled: false` for components that don't need real-time updates

## Troubleshooting

### Common Issues

1. **No realtime updates**: Check if `enabled` is set to `true` and verify your Supabase realtime is properly configured
2. **Connection lost**: The hook will automatically attempt to reconnect. Check your network connection
3. **Missing data**: Ensure the initial fetch completed successfully by checking the `loading` state

### Debug Mode

Enable debug logging to see realtime events:

```typescript
const { reports } = useRealtimeReports({
  onInsert: (report) => console.log('INSERT:', report),
  onUpdate: (report) => console.log('UPDATE:', report),
  onDelete: (id) => console.log('DELETE:', id),
});
```

## Examples

See the [examples directory](../examples/) for complete working examples of the `useRealtimeReports` hook in action.