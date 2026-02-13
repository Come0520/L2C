'use client';

import { useState } from 'react';
import { UserList } from './user-list';
import { UserForm } from './user-form';

interface UsersSettingsClientProps {
  userData: any[];
  availableRoles?: any[];
}

export function UsersSettingsClient({ userData, availableRoles = [] }: UsersSettingsClientProps) {
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setEditingUser(null);
    // Data is refreshed via server action revalidatePath, so usually we assume page data refreshes.
    // But since this is a client component receiving props, we rely on parent to refresh or router.refresh().
    // revalidatePath in Server Action should trigger RSC refetch.
  };

  return (
    <>
      <UserList data={userData} onEdit={handleEdit} />

      <UserForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingUser}
        onSuccess={handleSuccess}
        availableRoles={availableRoles}
      />
    </>
  );
}
