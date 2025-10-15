# useOfficers Hook

A React hook that provides real-time updates for officers using Supabase's realtime functionality. This hook automatically subscribes to changes in the officers table and keeps your component's state synchronized with the database.

## Features

- 🔄 **Real-time updates** with automatic state synchronization
- 📡 **Automatic subscription management** with connection status tracking
- 🎯 **Officer assignment** functionality for reports
- ⚡ **Caching** to prevent redundant API calls
- 🔧 **Manual control** over subscription lifecycle
- 🛡️ **Error handling** with detailed error messages
- 🎛️ **Flexible configuration** with optional callbacks

## Basic Usage

```tsx
import { useOfficers } from 'your-dispatch-lib';

function OfficersList() {
  const { officers, loading, assignToReport } = useOfficers();

  const handleAssign = async (officerId: number, reportId: number) => {
    const result = await assignToReport(officerId, reportId);
    if (result.error) {
      console.error('Assignment failed:', result.error);
    }
  };

  if (loading) return <div>Loading officers...</div>;

  return (
    <div>
      <h2>Officers</h2>
      {officers.map(officer => (
        <div key={officer.id}>
          <span>{officer.first_name} {officer.last_name}</span>
          <button onClick={() => handleAssign(officer.id, 123)}>
            Assign to Report
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Advanced Usage

```tsx
import { useOfficers } from 'your-dispatch-lib';

function OfficersManagement() {
  const { 
    officers, 
    loading, 
    error, 
    isConnected, 
    assignToReport,
    subscribe,
    unsubscribe 
  } = useOfficers({
    enabled: true,
    onInsert: (officer) => {
      console.log('New officer added:', officer);
      // Show notification, update UI, etc.
    },
    onUpdate: (officer) => {
      console.log('Officer updated:', officer);
      // Handle officer updates
    },
    onDelete: (officerId) => {
      console.log('Officer deleted:', officerId);
      // Handle officer deletion
    }
  });

  const handleAssign = async (officerId: number, reportId: number) => {
    const result = await assignToReport(officerId, reportId);
    if (result.error) {
      console.error('Assignment failed:', result.error);
    } else {
      console.log('Officer assigned successfully');
    }
  };

  if (loading) return <div>Loading officers...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div>
        <h2>Officers</h2>
        <p>Realtime Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      </div>
      
      {officers.map(officer => (
        <div key={officer.id}>
          <span>{officer.first_name} {officer.last_name}</span>
          <span> - {officer.rank}</span>
          <button onClick={() => handleAssign(officer.id, 123)}>
            Assign to Report
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Manual Subscription Control

You can control when the realtime subscription is active:

```tsx
import { useOfficers } from 'your-dispatch-lib';

function OfficersWithControls() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const { 
    officers, 
    loading, 
    subscribe,
    unsubscribe 
  } = useOfficers({
    enabled: false, // Start with subscription disabled
  });

  const handleToggleSubscription = () => {
    if (isSubscribed) {
      unsubscribe();
      setIsSubscribed(false);
    } else {
      subscribe();
      setIsSubscribed(true);
    }
  };

  return (
    <div>
      <button onClick={handleToggleSubscription}>
        {isSubscribed ? 'Stop' : 'Start'} Realtime Updates
      </button>
      
      {officers.map(officer => (
        <div key={officer.id}>
          {officer.first_name} {officer.last_name}
        </div>
      ))}
    </div>
  );
}
```

## Conditional Subscriptions

You can conditionally enable/disable the subscription based on user preferences or component state:

```tsx
import { useOfficers } from 'your-dispatch-lib';

function ConditionalOfficersList({ isAdmin, userId }) {
  const shouldSubscribe = isAdmin && userId; // Only subscribe if user is admin and logged in

  const { officers, loading, error } = useOfficers({
    enabled: shouldSubscribe,
  });

  if (loading) return <div>Loading officers...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Officers</h2>
      {!shouldSubscribe && (
        <div>Realtime updates disabled for your role</div>
      )}
      
      {officers.map(officer => (
        <div key={officer.id}>
          {officer.first_name} {officer.last_name}
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Whether to enable the realtime subscription |
| `onInsert` | `(officer: Officer) => void` | `undefined` | Callback fired when a new officer is inserted |
| `onUpdate` | `(officer: Officer) => void` | `undefined` | Callback fired when an officer is updated |
| `onDelete` | `(officerId: number) => void` | `undefined` | Callback fired when an officer is deleted |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `officers` | `Officer[]` | Array of officers from the database |
| `loading` | `boolean` | Whether the initial data is being loaded |
| `error` | `string \| null` | Error message if any operation failed |
| `isConnected` | `boolean` | Whether the realtime connection is active |
| `refresh` | `() => Promise<void>` | Function to manually refresh the officers data |
| `assignToReport` | `(officerId: number, reportId: number) => Promise<{ error?: string }>` | Function to assign an officer to a report |
| `subscribe` | `() => void` | Function to manually start the subscription |
| `unsubscribe` | `() => void` | Function to manually stop the subscription |

### Officer Type

```typescript
type Officer = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  rank: string;
  badge_number: string;
  assigned_report_id: number | null;
  created_at: string;
  updated_at: string;
}
```

## Error Handling

The hook provides comprehensive error handling:

```tsx
function OfficersWithErrorHandling() {
  const { officers, loading, error, isConnected } = useOfficers({
    enabled: true,
  });

  if (loading) return <div>Loading officers...</div>;
  
  if (error) {
    return (
      <div>
        <h2>Error Loading Officers</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div>
        <h2>Officers</h2>
        <p>⚠️ Realtime connection lost. Data may not be up to date.</p>
        {officers.map(officer => (
          <div key={officer.id}>
            {officer.first_name} {officer.last_name}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2>Officers</h2>
      {officers.map(officer => (
        <div key={officer.id}>
          {officer.first_name} {officer.last_name}
        </div>
      ))}
    </div>
  );
}
```

## Best Practices

- **Always handle loading and error states** in your components
- **Use the `enabled` option** to conditionally enable realtime updates
- **Implement proper cleanup** - the hook automatically handles this, but be mindful of component unmounting
- **Monitor connection status** using `isConnected` to provide user feedback
- **Use callbacks** for side effects like notifications or analytics
- **Handle assignment errors** properly in your UI

## Troubleshooting

### Common Issues

1. **No realtime updates**: Check if `enabled` is set to `true` and verify your Supabase realtime is properly configured
2. **Connection errors**: Ensure your Supabase project has realtime enabled and proper RLS policies
3. **Assignment failures**: Verify the officer and report IDs exist and the user has proper permissions
4. **Performance issues**: Consider using the `enabled` option to disable realtime when not needed

### Debug Mode

Enable debug logging to see realtime events:

```tsx
const { officers } = useOfficers({
  enabled: true,
  onInsert: (officer) => console.log('Officer inserted:', officer),
  onUpdate: (officer) => console.log('Officer updated:', officer),
  onDelete: (officerId) => console.log('Officer deleted:', officerId),
});
```

## Examples

See the [examples directory](../examples/) for complete working examples of the `useOfficers` hook in action.