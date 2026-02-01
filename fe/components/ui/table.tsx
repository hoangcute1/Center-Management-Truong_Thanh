import * as React from "react";
import clsx from "clsx";

// Table
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={clsx("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

// TableHeader
interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return <thead className={clsx("[&_tr]:border-b", className)} {...props} />;
}

// TableBody
interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody
      className={clsx("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

// TableFooter
interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableFooter({ className, ...props }: TableFooterProps) {
  return (
    <tfoot
      className={clsx(
        "border-t bg-gray-100/50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

// TableRow
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={clsx(
        "border-b transition-colors hover:bg-gray-100/50 data-[state=selected]:bg-gray-100",
        className,
      )}
      {...props}
    />
  );
}

// TableHead
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={clsx(
        "h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

// TableCell
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={clsx(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

// TableCaption
interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

export function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      className={clsx("mt-4 text-sm text-gray-500", className)}
      {...props}
    />
  );
}
