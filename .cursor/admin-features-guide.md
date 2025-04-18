# Admin Features Guide

This document provides a comprehensive guide to the admin-related features in the Business4 application.

## Table of Contents

1. [Admin Menu](#admin-menu)
2. [Store Dropdown](#store-dropdown)
3. [Calendar/Date Selector](#calendar-date-selector)
4. [Admin Panel](#admin-panel)
5. [Users Management](#users-management)
6. [Add New User](#add-new-user)
7. [User Accounts](#user-accounts)
8. [Manage Stores Tab](#manage-stores-tab)
9. [Assign Users to Store](#assign-users-to-store)

## Admin Menu

The admin menu is implemented in `MainNavigation.tsx` and provides navigation to various admin-related pages.

### Key Components:
- `MainNavigation.tsx`: Contains the main navigation menu with links to different sections of the application.
- Uses the `NavigationMenu` component from the UI library.
- Includes links to Dashboard, Admin, Audit Logs, Reports, and Settings.

### Implementation Details:
- The menu uses React Router's `Link` component for navigation.
- The active menu item is highlighted based on the current route.
- Icons from Lucide React are used for visual representation.

### Usage:
```tsx
<NavigationMenuItem>
  <Link to="/admin">
    <div className={cn(
      navigationMenuTriggerStyle(),
      isActive('/admin') ? "bg-accent text-accent-foreground" : ""
    )}>
      <Users className="mr-2 h-4 w-4" />
      <span>Admin</span>
    </div>
  </Link>
</NavigationMenuItem>
```

## Store Dropdown

The store dropdown is implemented in `StoreSelector.tsx` and allows users to select a store from a list of available stores.

### Key Components:
- `StoreSelector.tsx`: A dropdown component that displays a list of stores and allows the user to select one.
- Uses the `Popover` component from the UI library.
- Integrates with the `StoreContext` to fetch and manage store data.

### Implementation Details:
- The component fetches stores when mounted using the `fetchStores` function from the `StoreContext`.
- It displays a loading state while stores are being fetched.
- It shows a message when no stores are available.
- When a store is selected, it updates the current store in the `StoreContext`.

### Usage:
```tsx
<StoreSelector className="w-[200px]" />
```

## Calendar/Date Selector

The calendar/date selector is implemented in `DateSelector.tsx` and allows users to select a date for reports.

### Key Components:
- `DateSelector.tsx`: A component that displays a calendar and allows the user to select a date.
- Uses the `Calendar` component from the UI library.
- Integrates with the `ReportDataContext` to manage the selected date.

### Implementation Details:
- The component uses the `Popover` component to display the calendar.
- It formats the selected date using the `format` function from `date-fns`.
- When a date is selected, it updates the selected date in the `ReportDataContext` and fetches report data for the selected date.

### Usage:
```tsx
<DateSelector showLabel={true} />
```

## Admin Panel

The admin panel is implemented in `AdminPage.tsx` and provides a comprehensive interface for managing users and stores.

### Key Components:
- `AdminPage.tsx`: The main admin panel component that contains tabs for managing users and stores.
- Uses the `Tabs` component from the UI library.
- Integrates with the `StoreContext` and `AuthContext` to manage store and user data.

### Implementation Details:
- The component uses tabs to separate different management sections.
- It includes functionality for adding, editing, and deleting users and stores.
- It provides a dialog for assigning users to stores.

### Usage:
```tsx
<AdminPage />
```

## Users Management

Users management is implemented in the "Users" tab of the `AdminPage.tsx` component.

### Key Components:
- User list display
- Add user functionality
- Edit user functionality
- Delete user functionality

### Implementation Details:
- The component displays a list of users with their details.
- It provides buttons for adding, editing, and deleting users.
- It uses a dialog for adding and editing users.
- It integrates with the API to perform CRUD operations on users.

### Usage:
```tsx
// Inside AdminPage.tsx
<TabsContent value="users">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-2xl font-bold">Users</h2>
    <Button onClick={() => setIsUserDialogOpen(true)}>
      <UserPlus className="mr-2 h-4 w-4" />
      Add User
    </Button>
  </div>
  {/* User list */}
</TabsContent>
```

## Add New User

Adding a new user is implemented in the user dialog in `AdminPage.tsx`.

### Key Components:
- User form dialog
- Form validation using Zod
- API integration for creating users

### Implementation Details:
- The component uses a dialog to display a form for adding a new user.
- It uses the `useForm` hook from `react-hook-form` for form management.
- It validates the form using Zod schemas.
- It integrates with the API to create a new user.

### Usage:
```tsx
// Inside AdminPage.tsx
<Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add New User</DialogTitle>
    </DialogHeader>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Form fields */}
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

## User Accounts

User accounts are managed through the `AuthContext.tsx` and the user management section in `AdminPage.tsx`.

### Key Components:
- `AuthContext.tsx`: Manages user authentication and account data.
- User management in `AdminPage.tsx`: Provides an interface for managing user accounts.

### Implementation Details:
- The `AuthContext` provides functions for login, logout, register, and updateUser.
- It stores the user token in localStorage and sets it in the API headers.
- The user management section in `AdminPage.tsx` provides an interface for managing user accounts.

### Usage:
```tsx
// Using AuthContext
const { user, login, logout, register, updateUser } = useAuth();

// Login
await login(email, password);

// Logout
logout();

// Register
await register(userData);

// Update user
await updateUser(userData);
```

## Manage Stores Tab

The manage stores tab is implemented in the "Stores" tab of the `AdminPage.tsx` component and in the `ManageStores.tsx` component.

### Key Components:
- Store list display
- Add store functionality
- Edit store functionality
- Delete store functionality

### Implementation Details:
- The component displays a list of stores with their details.
- It provides buttons for adding, editing, and deleting stores.
- It uses a dialog for adding and editing stores.
- It integrates with the API to perform CRUD operations on stores.

### Usage:
```tsx
// Inside AdminPage.tsx
<TabsContent value="stores">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-2xl font-bold">Stores</h2>
    <Button onClick={openAddStoreDialog}>
      <Plus className="mr-2 h-4 w-4" />
      Add Store
    </Button>
  </div>
  {/* Store list */}
</TabsContent>
```

## Assign Users to Store

Assigning users to stores is implemented in the `AdminPage.tsx` and `ManageStores.tsx` components.

### Key Components:
- User assignment dialog
- Store assignment functionality
- API integration for assigning users to stores

### Implementation Details:
- The component uses a dialog to display a list of users and allows the user to assign them to a store.
- It provides functionality for assigning and unassigning users to stores.
- It integrates with the API to perform the assignment operations.

### Usage:
```tsx
// Inside AdminPage.tsx
<Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Assign Users to Store</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      {/* User list with checkboxes */}
    </div>
    <DialogFooter>
      <Button onClick={assignStoreToUser}>Assign</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## State Management

The admin features use several contexts for state management:

1. **AuthContext**: Manages user authentication and account data.
2. **StoreContext**: Manages store data and the current selected store.
3. **ReportDataContext**: Manages report data and the selected date.

### Key Contexts:
- `AuthContext.tsx`: Provides user authentication and account management.
- `StoreContext.tsx`: Provides store management and selection.
- `ReportDataContext.tsx`: Provides report data management and date selection.

### Implementation Details:
- The contexts use React's Context API to provide state and functions to components.
- They use the `useState` and `useEffect` hooks for state management.
- They integrate with the API to fetch and update data.

### Usage:
```tsx
// Using AuthContext
const { user, login, logout } = useAuth();

// Using StoreContext
const { stores, currentStore, setCurrentStore } = useStore();

// Using ReportDataContext
const { selectedDate, setSelectedDate, fetchReportData } = useReportData();
```

## API Integration

The admin features integrate with the API to perform CRUD operations on users and stores.

### Key API Endpoints:
- `/api/auth/login`: Authenticates a user.
- `/api/auth/register`: Registers a new user.
- `/api/users`: Manages user data.
- `/api/stores`: Manages store data.

### Implementation Details:
- The API integration is handled through the `api` service.
- The contexts use the API service to fetch and update data.
- The components use the contexts to access the API functionality.

### Usage:
```tsx
// Inside AuthContext.tsx
const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    
    toast.success('Login successful');
    navigate('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    toast.error('Invalid email or password');
    throw error;
  }
};
``` 