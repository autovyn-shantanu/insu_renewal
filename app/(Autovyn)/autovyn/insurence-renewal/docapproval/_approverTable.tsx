import React, { useEffect, useRef, useState } from "react";
import { useTable, useGlobalFilter, usePagination, useSortBy } from "react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "antd";
import { FaCheck } from "react-icons/fa";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";
import Ainput from "@/components/atoms/Input";

const MAX_CONTENT_LENGTH = 50; // Set your desired maximum content length

const truncateText = (text) => {
  return text.length > MAX_CONTENT_LENGTH
    ? text.substring(0, MAX_CONTENT_LENGTH) + "..."
    : text;
};

const DataTable = ({
  check,
  columns,
  data,
  onRowDoubleClick,
  setsellectedrowdata,
  handleapprove,
  handlereject,
  selectValue,
  height,
  texta,
  status,
  handleRemark,
  remark,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    state,
    setGlobalFilter,
  } = useTable(
    { columns, data, initialState: { pageSize: data?.length || 50 } },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  useEffect(() => {
    if (!check) {
      setSelectedRows([]);
    }
  }, [check]);

  const toggleRowSelection = (rowId, rowData) => {
    setSelectedRows((prevSelected) => {
      const isAlreadySelected = prevSelected.some((row) => row.id === rowId);
      const updated = isAlreadySelected
        ? prevSelected.filter((row) => row.id !== rowId)
        : [...prevSelected, { id: rowId, rowData }];
      setsellectedrowdata(updated);
      return updated;
    });
  };

  const toggleSelectAll = () => {
    const newSelectedRows = selectAll
      ? []
      : data.map((row) => ({ id: row[selectValue] ?? row.UTD, rowData: row }));
    setSelectedRows(newSelectedRows);
    setsellectedrowdata(newSelectedRows);
    setSelectAll(!selectAll);
  };

  const handleRowClick = (rowId, rowData) => {
    toggleRowSelection(rowId, rowData);
  };

  const { globalFilter } = state;
  const tableRef = useRef(null);
  return (
    <div className="p-1 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
          <DownloadTableExcel
            filename={`Document Approver Grid ${new Date().toLocaleDateString('en-IN')} ${new Date().getHours().toString().padStart(2, '0')}-${new Date().getMinutes().toString().padStart(2, '0')}`}
            sheet="Sheet1"
            currentTableRef={tableRef.current}
          >
            <Button className="w-full sm:w-auto text-xs sm:text-sm font-bold h-8 shrink-0" variant={"print"}>
              Export to Excel
            </Button>
          </DownloadTableExcel>
          <input
            className="border border-[#b5bfcb] dark:border-[#D0D5DD] px-2.5 w-full sm:w-52 h-8 dark:text-white py-1 dark:bg-input rounded text-xs sm:text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
            type="text"
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search..."
          />
        </div>
      </div>

      <div
        className="overflow-x-auto overflow-y-scroll no-visible-scrollbar w-full"
        style={{ height: height }}
      >
        <table
          {...getTableProps()}
          ref={tableRef}
          className="table-auto w-full uppercase text-xs font-bold shadow rounded-lg p-2"
        >
          <thead
            className="sticky top-0 z-1 border-b border-body-color h-6 bg-[#193A69] dark:bg-input text-white dark:text-white"
            style={{ borderRadius: "5px" }}
          >
            <tr>
              <th className="border w-10 px-2">
                <FaCheck />
              </th>
              {headerGroups.map((headerGroup, headerIndex) => (
                <React.Fragment key={headerIndex}>
                  {headerGroup.headers.map((column) => (
                    <th
                      key={column.id}
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className="border text-xs text-left px-2 py-3 text-ellipsis whitespace-nowrap font-semibold"
                    >
                      <span>{column.render("Header")}</span>
                      <span className="ml-1">
                        {column.isSorted ? (
                          column.isSortedDesc ? (
                            <FontAwesomeIcon icon={faSortDown} size="10px" />
                          ) : (
                            <FontAwesomeIcon icon={faSortUp} size="10px" />
                          )
                        ) : (
                          <FontAwesomeIcon icon={faSort} />
                        )}
                      </span>
                    </th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody
            {...getTableBodyProps()}
            className="rounded-lg"
          >
            {page.map((row) => {
              prepareRow(row);
              const utd = row.original?.[selectValue] ?? row.values?.[selectValue] ?? row.original?.UTD ?? row.id;
              const isSelected = selectedRows.some((r) => r.id === utd);
              return (
                <tr
                  key={row.id}
                  {...row.getRowProps()}
                  className={`hover:bg-grey cursor-pointer ${isSelected ? "bg-gray-200" : ""}`}
                  onClick={() => handleRowClick(utd, row.original)}
                  onDoubleClick={() => onRowDoubleClick(row.original)}
                >
                  <td
                    className="border text-left px-2 border-body-color"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {row?.original?.status_khud_ka == null ? (
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleRowSelection(utd, row.original)}
                      />
                    ) : (
                      row?.status_khud_ka
                    )}
                  </td>
                  {row.cells.map((cell) => (
                    <td
                      key={cell.column.id}
                      {...cell.getCellProps()}
                      className={`border text-left border-body-color px-2 py-1 text-ellipsis whitespace-nowrap ${cell.column.align === "right"
                        ? "text-right"
                        : cell.column.align === "center"
                          ? "text-center"
                          : "text-left"
                        }`}
                    >
                      <div
                        title={typeof cell.value === "string" ? cell.value : ""}
                        className="text-xs font-semibold"
                      >
                        {truncateText(cell.render("Cell"))}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {status == 2 && (
        <div className="p-2 sm:p-3 border-t flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50 dark:bg-transparent rounded-b">
          <div className="flex items-center gap-2 shrink-0">
            <Checkbox
              checked={selectAll}
              onChange={toggleSelectAll}
            />
            <span className="font-bold text-xs sm:text-sm">
              Selecting All Pending Records.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 justify-start md:justify-end">
            <div className="w-full sm:w-64 md:w-80 [&_label]:hidden">
              <Ainput
                title="Remark"
                placeholder="Enter Remark..."
                type="text"
                name="remark"
                value={remark}
                handleInputChange={handleRemark}
                max={300}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant={"update"} onClick={handleapprove} className="flex-1 sm:flex-none text-xs sm:text-sm h-9 px-4 font-bold">
                {texta}
              </Button>
              <Button variant={"print"} onClick={handlereject} className="flex-1 sm:flex-none text-xs sm:text-sm h-9 px-4 font-bold">
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
