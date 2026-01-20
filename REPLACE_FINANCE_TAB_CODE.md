# 🔧 CODE THAY THẾ TAB TÀI CHÍNH

## Vị trí cần thay thế

**File:** `fe/components/dashboards/admin-dashboard.tsx`  
**Từ dòng:** ~3003 (comment `{/* Tab Tài chính */}`)  
**Đến dòng:** ~3220 (kết thúc `</TabsContent>` của finance)

**Cách thay thế:**
1. Tìm dòng `{/* Tab Tài chính */}` (line ~3003)
2. Xóa TẤT CẢ từ dòng đó đến hết `</TabsContent>` của finance
3. Copy code dưới đây vào vị trí đó

---

## CODE MỚI - TAB TÀI CHÍNH

```tsx
{/* Tab Tàichính */}
<TabsContent value="finance" className="mt-6">
  {/* Branch Selector & Year Selector */}
  <div className="mb-6 flex gap-4 items-center">
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Chọn cơ sở
      </label>
      <select
        value={selectedBranch}
        onChange={(e) => setSelectedBranch(e.target.value)}
        className="w-full rounded-xl border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="ALL">Tất cả cơ sở</option>
        {branches.map((branch) => (
          <option key={branch._id} value={branch._id}>
            {branch.name}
          </option>
        ))}
      </select>
    </div>
    
    <div className="w-40">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Năm
      </label>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="w-full rounded-xl border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value={2026}>2026</option>
        <option value={2025}>2025</option>
        <option value={2024}>2024</option>
      </select>
    </div>
  </div>

  {/* Loading State */}
  {financeLoading && (
    <Card className="p-12 text-center bg-white border-0 shadow-lg">
      <div className="text-6xl mb-4 animate-pulse">💰</div>
      <p className="text-gray-500 text-lg font-medium">
        Đang tải dữ liệu tài chính...
      </p>
    </Card>
  )}

  {/* Error State */}
  {financeError && !financeLoading && (
    <Card className="p-12 text-center bg-white border-0 shadow-lg">
      <div className="text-6xl mb-4">❌</div>
      <p className="text-red-600 text-lg font-medium mb-2">
        {financeError}
      </p>
      <Button
        onClick={() => {
          clearFinanceError();
          fetchDashboard(selectedBranch, selectedYear);
        }}
        className="mt-4"
      >
        Thử lại
      </Button>
    </Card>
  )}

  {/* Dashboard Content */}
  {!financeLoading && !financeError && financeDashboard && (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {/* Total Revenue */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-90" />
          <div className="relative p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">
                  💰 Tổng Thu
                </p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(financeDashboard.summary.totalRevenue)}
                </p>
                <p className="text-white/70 text-xs mt-1">
                  {financeDashboard.summary.totalRevenue > 0 
                    ? `${selectedBranch === "ALL" ? "Tất cả cơ sở" : "Cơ sở này"}`
                    : "Chưa có dữ liệu"}
                </p>
              </div>
              <span className="text-4xl opacity-80">📈</span>
            </div>
          </div>
        </Card>

        {/* Total Expense */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-600 opacity-90" />
          <div className="relative p-5 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-white/80 text-sm font-medium">
                    💸 Tổng Chi
                  </p>
                  {selectedBranch !== "ALL" && (
                    <button
                      onClick={() => setShowExpenseModal(true)}
                      className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      + Thêm
                    </button>
                  )}
                </div>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(financeDashboard.summary.totalExpense)}
                </p>
                <p className="text-white/70 text-xs mt-1">
                  {financeDashboard.summary.totalExpense > 0
                    ? `Chi phí vận hành`
                    : "Chưa có chi phí"}
                </p>
              </div>
              <span className="text-4xl opacity-80">💸</span>
            </div>
          </div>
        </Card>

        {/* Profit */}
        <Card className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${
            financeDashboard.summary.profit >= 0
              ? 'from-blue-500 to-indigo-600'
              : 'from-orange-500 to-red-600'
          } opacity-90`} />
          <div className="relative p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">
                  💎 Lợi nhuận
                </p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(financeDashboard.summary.profit)}
                </p>
                <p className="text-white/70 text-xs mt-1">
                  = Thu - Chi
                </p>
              </div>
              <span className="text-4xl opacity-80">
                {financeDashboard.summary.profit >= 0 ? '📊' : '📉'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Revenue/Expense by Month Chart */}
        <Card className="p-6 bg-white border-0 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📈</span>
            <div>
              <p className="font-bold text-gray-900">
                Thu/Chi theo tháng
              </p>
              <p className="text-xs text-gray-500">
                Năm {selectedYear}
              </p>
            </div>
          </div>
          <div className="h-72">
            {financeDashboard.chart.revenueByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={financeDashboard.chart.revenueByMonth.map((item, idx) => ({
                    month: getMonthName(item.month),
                    thu: item.amount / 1000000,
                    chi: (financeDashboard.chart.expenseByMonth[idx]?.amount || 0) / 1000000,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)} Tr`]}
                  />
                  <Bar
                    dataKey="thu"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="Thu"
                  />
                  <Bar
                    dataKey="chi"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    name="Chi"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                📊 Chưa có dữ liệu
              </div>
            )}
          </div>
        </Card>

        {/* Revenue by Subject Chart */}
        <Card className="p-6 bg-white border-0 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-bold text-gray-900">
                Thu theo môn học
              </p>
              <p className="text-xs text-gray-500">
                Phân bổ doanh thu
              </p>
            </div>
          </div>
          <div className="h-72">
            {financeDashboard.revenueBySubject.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financeDashboard.revenueBySubject}
                    dataKey="amount"
                    nameKey="subject"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ subject, amount }: { subject: string; amount: number }) => {
                      const total = financeDashboard.revenueBySubject.reduce((sum, s) => sum + s.amount, 0);
                      const percent = total > 0 ? ((amount / total) * 100).toFixed(0) : 0;
                      return `${subject} ${percent}%`;
                    }}
                  >
                    {financeDashboard.revenueBySubject.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${formatCurrency(value)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                🎯 Chưa có dữ liệu phân bổ
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Detail Table */}
      <Card className="p-6 bg-white border-0 shadow-lg mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📋</span>
          <div>
            <p className="font-bold text-gray-900">
              Chi tiết theo tháng
            </p>
            <p className="text-xs text-gray-500">
              Bảng phân tích thu/chi
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  Tháng
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">
                  Thu
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">
                  Chi
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">
                  Lợi nhuận
                </th>
              </tr>
            </thead>
            <tbody>
              {financeDashboard.detailByMonth.map((row) => (
                <tr
                  key={row.month}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium text-gray-900">
                    Tháng {row.month}
                  </td>
                  <td className="py-3 px-4 text-right text-blue-600 font-semibold">
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className="py-3 px-4 text-right text-red-500 font-semibold">
                    {formatCurrency(row.expense)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        row.profit >= 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {formatCurrency(row.profit)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expense History (only if branch != ALL) */}
      {selectedBranch !== "ALL" && expenses.length > 0 && (
        <Card className="p-6 bg-white border-0 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📜</span>
            <div>
              <p className="font-bold text-gray-900">
                Lịch sử chi phí
              </p>
              <p className="text-xs text-gray-500">
                Danh sách chi phí đã tạo
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">
                    Ngày
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">
                    Nội dung
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">
                    Số tiền
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr
                    key={expense._id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-700">
                      {new Date(expense.expenseDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {expense.description}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600 font-semibold">
                      {expense.amount.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(expense._id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )}

  {/* Expense Modal */}
  <ExpenseModal
    isOpen={showExpenseModal}
    branchId={selectedBranch}
    onClose={() => setShowExpenseModal(false)}
    onSubmit={handleAddExpense}
  />
</TabsContent>
```

---

## 🎯 HƯỚNG DẪN THAY THẾ

1. **Mở file:** `fe/components/dashboards/admin-dashboard.tsx`

2. **Tìm dòng:** `{/* Tab Tài chính */}` (line ~3003)

3. **Scroll xuống tìm dòng kết thúc** của `</TabsContent>` cho tab finance (dòng ~3220)

4. **Xóa toàn bộ** từ `{/* Tab Tài chính */}` đến `</TabsContent>`

5. **Paste code mới** ở trên vào vị trí đó

6. **Save file**

---

**Lưu ý:** Sau khi thay thế, tất cả lint errors về `financeOverview` sẽ biến mất vì chúng ta đã thay bằng `financeDashboard`!
