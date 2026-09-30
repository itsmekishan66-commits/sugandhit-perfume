import { Eye, Pencil, Trash2 } from 'lucide-react';

interface RowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
  size?: 14 | 16 | 18;
}

const RowActions = ({
  onView,
  onEdit,
  onDelete,
  viewTitle = 'View',
  editTitle = 'Edit',
  deleteTitle = 'Delete',
  size = 14,
}: RowActionsProps) => {
  if (!onView && !onEdit && !onDelete) return null;

  const iconCls = `inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gold/25 bg-white/70 text-ink-soft hover:text-espresso cursor-pointer`;

  return (
    <div className="inline-flex gap-1.5">
      {onView && (
        <button onClick={onView} className={iconCls} title={viewTitle}>
          <Eye size={size} />
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} className={iconCls} title={editTitle}>
          <Pencil size={size} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className={`${iconCls} hover:text-red-600`} title={deleteTitle}>
          <Trash2 size={size} />
        </button>
      )}
    </div>
  );
};

export default RowActions;