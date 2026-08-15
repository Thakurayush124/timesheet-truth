# Roster Watch

so what is want to build is an roaster validator in which i upload my attendence data (AMS ) AND ROASTTER DATA AND GET A SUMMARIZE TABLE FOR IT so for my attendence data i have two format A.xlsx is monthly atttendence data and A1.csv is daily attendence data and Ro.xlsx is roaster data analysis the structer and format of the data and Additional Requirements – Excel Data Format, Visible Exceptions & Functional Filters

Update the Attendance vs Roster Compliance application with the following mandatory requirements.

1. Attendance Excel – Column Data Types & Expected Values

The application must explicitly define and validate the expected format for every Attendance Excel column.

Column	Data Type	Expected Value / Format	Example

Date	Date	DD/MM/YYYY or Excel Date	01/05/2026

Employee - Name	Text	Employee full name	Lokesh Pittu

Reporting Manager	Text	Manager full name	Kalyana Raman

Employee OLM	Text	OLM ID / Employee ID	B0265747

Domain	Text	Domain name	VoiceNOC_Experience & STP_Operations

Vertical	Text	Vertical name	Service Experience

Attendance Status	Text / Enum	Present, Absent, Week-Off, Leave, Holiday etc.	Present

Shift Type	Text / Enum	AMS shift abbreviation/name	G

Company	Text	Company name	Airtel

CheckIn Time	DateTime / Time	HH:MM or Excel DateTime	09:32 AM

CheckOut Time	DateTime / Time	HH:MM or Excel DateTime	06:35 PM

Total Hours	Decimal / Duration	HH:MM or decimal hours	09:03

Meeting Time	Decimal / Duration	HH:MM or decimal hours	01:00

TrainingTime	Decimal / Duration	HH:MM or decimal hours	00:30

Remark	Text	Free text	Regular Shift

Premises	Text	Location / premise	Office

ReportingManager OLM	Text	OLM ID	B0035047

Attendance parsing rules

Date

Convert all Excel date representations into a standard internal format:

YYYY-MM-DD

Example:

01/05/2026 → 2026-05-01

Do not interpret 05/01/2026 incorrectly. Use the Excel cell's native date value where available.

Employee OLM

Treat Employee OLM as a string, not a number.

For example:

B0265747

must remain:

B0265747

Never remove the alphabetic prefix or leading zeroes.

Attendance Status

Normalize values to a standard set.

For example:

Present

Absent

Week-Off

Leave

Holiday

Missing

The application should allow additional values without breaking processing.

Shift Type

Normalize AMS shift values.

Possible values:

A

G

LG

B

N

WO

If the source contains full names such as:

General

convert internally to:

G

If an unknown shift is encountered, flag it as:

Unknown AMS Shift

CheckIn Time / CheckOut Time

Convert all time formats into a standard internal time representation.

Examples accepted:

09:30 AM

09:30

9:30

2026-05-01 09:30:00

The application should extract only the relevant time component for shift comparison.

For night shifts, retain the actual date/time information so that overnight calculations are accurate.

Total Hours

Support:

09:30

or:

9.5

Convert internally to decimal hours.

Example:

09:30 → 9.5 hours

2. Roster Excel – Column Data Types & Expected Values

The Roster Excel has a different structure because dates are represented as columns.

Example:

Function	OLMID	Employee Name	1 May	2 May	3 May

IP Access	B0271873	Palanivel R	G	WO	WO

Define the following:

Column	Data Type	Expected Value / Format	Example

Function	Text	Team / Function name	IP Access

OLMID	Text	Employee OLM ID	B0271873

Employee Name	Text	Employee full name	Palanivel R

Date Columns	Date	Excel date / Day-Month	1 May

Shift Cell	Text / Enum	Shift abbreviation	G

3. Roster Shift Values

Roster shift cells must support:

Value	Meaning	Working Day

A	Morning	Yes

G	General	Yes

LG	Late General	Yes

B	Evening	Yes

N	Night	Yes

WO	Week-Off	No

Allow configurable additional non-working codes such as:

Leave

L

Holiday

H

OFF

Unknown values must be highlighted during validation.

4. Internal Normalized Roster Table

Do NOT perform calculations directly on the wide-format roster.

Transform:

1 May | 2 May | 3 May | 4 May...

into:

OLMID	Employee Name	Function	Date	Roster Shift

B0271873	Palanivel R	IP Access	2026-05-01	G

B0271873	Palanivel R	IP Access	2026-05-02	WO

B0271873	Palanivel R	IP Access	2026-05-03	WO

B0271873	Palanivel R	IP Access	2026-05-04	G

This normalized table must be used for all calculations.

5. Employee-Level Exception Visibility

Exceptions MUST be visible directly in the employee summary table.

Do not require the user to open the employee drill-down just to understand why the employee is non-compliant.

Add these columns:

Employee	Compliance %	Exception Days	Exception Type	Exception Details

Example:

| Palanivel R | 86.36% | 3 | Shift Timing Mismatch, Missing Attendance | 2 Shift Mismatch, 1 Missing Attendance |

6. Exception Summary Against Employee

For every employee, create a consolidated exception summary.

Example:

Palanivel R

⚠ 3 Exceptions

Shift Timing Mismatch: 2

Missing Attendance Record: 1

Another example:

Rahul Kumar

🔴 5 Exceptions

Absent: 2

Shift Timing Mismatch: 2

Missing Attendance: 1

The exception summary should be visible without opening another page.

7. Exception Badges

In the employee table, show exceptions using visual badges.

Example:

Employee	Attendance %	Compliance %	Exceptions	Status

Palanivel R	95.45%	86.36%	Shift Mismatch (2) Missing (1)	Attention Required

Rahul Kumar	81.82%	72.73%	Absent (2) Mismatch (2) Missing (1)	Non-Compliant

Amit Sharma	100%	100%	No Exception	Compliant

Use different visual treatment for different exception types.

Do not rely only on color; include readable text.

8. Employee Exception Tooltip

When the user hovers/clicks on an exception badge, show:

Exception: Shift Timing Mismatch

Dates:

05-May-2026

17-May-2026

Roster Shift: G

AMS Shift: A

Expected Check-In: 09:30 AM

Actual Check-In: 07:02 AM

This makes the exception immediately explainable.

9. Exception Details Column

Add:

Exception Details

Example:

05-May: Roster G / AMS A

17-May: Roster G / Check-In 19:35

21-May: Missing Attendance

For multiple exceptions, show a summarized value with a clickable "View Details".

10. Daily Reconciliation – Exception Visibility

The daily reconciliation table must clearly show exception status.

Use columns:

Date	Employee	Roster	AMS	Expected In	Actual In	Expected Out	Actual Out	Attendance	Exception	Exception Reason

Example:

| 05-May | Palanivel R | G | A | 09:30 | 07:02 | 18:30 | 16:05 | Present | Yes | Shift Timing Mismatch |

11. Exception Classification

Use these exact exception labels:

1. Shift Timing Mismatch

Trigger when:

Roster Shift != AMS Shift

OR

the actual check-in timing differs from the expected shift timing by 10 hours or more.

2. Absent on Planned Working Day

Trigger when:

Roster = working shift

AND

Attendance Status = Absent.

3. Missing Attendance Record

Trigger when:

Roster = working shift

AND

no attendance record exists for Employee OLM + Date.

4. Worked on Week-Off

Trigger when:

Roster = WO

AND

attendance shows Present.

This is informational and should not reduce compliance by default.

12. Filter System – Mandatory Functional Requirement

All filters must be fully functional, not just UI placeholders.

Create a global filter bar.

Filters:

Month

Example:

May 2026

June 2026

July 2026

Employee

Searchable dropdown.

OLMID

Searchable dropdown/input.

Team / Function

Dropdown.

Domain

Dropdown.

Reporting Manager

Dropdown.

Roster Shift

Multi-select:

A

G

LG

B

N

WO

AMS Shift

Multi-select:

A

G

LG

B

N

WO

Attendance Status

Multi-select:

Present

Absent

Week-Off

Leave

Holiday

Missing

Exception Type

Multi-select:

Shift Timing Mismatch

Absent on Planned Working Day

Missing Attendance Record

Worked on Week-Off

No Exception

Compliance Status

Multi-select:

Compliant

Attention Required

Non-Compliant

13. Filters Must Cross-Filter Everything

When a filter is applied, it must update:

KPI cards

Employee summary

Employee ranking

Exception summary

Exception charts

Daily reconciliation

Employee drill-down

Exported data

Example:

If user selects:

Team = IP Access

then every KPI and table must show only IP Access employees.

If user selects:

Exception = Shift Timing Mismatch

then the employee table should show only employees having at least one Shift Timing Mismatch.

14. Employee Search

Provide a global search box.

The search should support:

Employee Name

OLMID

Manager Name

Example:

Search:

B0271873

should immediately show:

Palanivel R

Search:

Palanivel

should show the employee.

Search should be case-insensitive.

15. Multiple Filter Behaviour

Filters must work together.

Example:

Team = IP Access

Roster Shift = G

Compliance Status = Non-Compliant

Exception = Shift Timing Mismatch

should return only employees satisfying ALL selected conditions.

Use:

AND logic between different filter categories

and

OR logic within the same multi-select category.

Example:

Roster Shift:

G + LG

means:

Roster Shift = G OR LG

while:

Team:

IP Access

means:

Team = IP Access

Combined:

Team = IP Access AND (Roster Shift = G OR LG)

16. Clear Filters

Provide:

Clear All Filters

button.

Clicking it must restore the complete dataset.

Also display:

Active Filters: 4

so users know how many filters are currently applied.

17. Filter Persistence

When navigating between:

Dashboard

Employee Analysis

Daily Reconciliation

Exceptions

retain the selected filters.

The user should not have to select the same filters repeatedly.

Provide:

Reset Filters

when required.

18. Dynamic KPI Calculation

KPI cards must recalculate based on the filtered dataset.

Example:

Full dataset:

Employees = 100

Compliance = 91%

After selecting:

Team = IP Access

the KPI cards should change to:

Employees = 32

Compliance = 87%

Do not display static values.

19. Exception Dashboard

Create a dedicated exception section.

Show:

Exception Distribution

Shift Timing Mismatch

Absent on Planned Working Day

Missing Attendance Record

Worked on Week-Off

Each exception should show:

Count of Exception Days

and

Number of Employees impacted

Example:

Exception	Days	Employees

Shift Timing Mismatch	42	18

Missing Attendance	16	12

Absent	11	9

These values must also respond to filters.

20. Employee Summary Table – Final Format

Use this as the primary employee-level table:

Employee Name	OLMID	Team	Manager Email	Shift (Roster)	Shift (AMS)	Mismatch Days	Planned Days	Present Days	Attendance %	Planned Hours	Actual Hours	Avg Hours / Day	Compliance %	Exception Days	Exception Type	Exception Details	Status

Make this table:

Sortable

Filterable

Searchable

Paginated

Exportable

21. Sorting

Allow sorting by every numeric KPI.

Especially:

Attendance %

Compliance %

Exception Days

Mismatch Days

Planned Hours

Actual Hours

Avg Hours / Day

Default sorting:

Compliance % ascending

so employees requiring attention appear first.

22. Exception-First View

Add a toggle:

All Employees | Exceptions Only

When:

Exceptions Only

is selected, show employees where:

Exception Days > 0

This should be a real filter, not a visual-only toggle.

23. Daily Exception View

Add another toggle:

All Days | Exception Days Only

When Exception Days Only is selected, show only:

Shift Timing Mismatch

Absent

Missing Attendance

Other configured exceptions

Do not show normal compliant days.

24. Export Must Respect Filters

If the user applies filters and clicks:

Export Excel

export only the filtered data.

Example:

Selected:

Team = IP Access

Status = Non-Compliant

The exported Excel must contain only the filtered IP Access non-compliant employees.

Provide two options:

Export Summary

and

Export Daily Details

25. Data Quality Warning

Display a warning section after upload.

Example:

Data Validation

✓ Attendance records loaded: 12,450

✓ Roster records loaded: 13,200

✓ Employees matched: 487

⚠ Employees only in Attendance: 8

⚠ Employees only in Roster: 5

⚠ Unknown shift codes: 3

⚠ Invalid attendance timestamps: 7

Clicking each warning should show the affected records.

26. Important Implementation Rule

Do not calculate employee-level exceptions directly from the monthly summary.

The calculation hierarchy MUST be:

Attendance Excel

+

Roster Excel

↓

Normalized Attendance Dataset

↓

Normalized Roster Dataset

↓

Employee + Date Matching

↓

Daily Reconciliation

↓

Daily Exception Classification

↓

Monthly Employee Aggregation

↓

Dashboard

This is critical to prevent inconsistencies between:

Attendance %

Compliance %

Exception Days

Mismatch Days

Planned Days

Present Days

27. Final Business Definition

Keep these definitions strictly separate:

Attendance %

Measures whether the employee was present.

Attendance % = Present Days / Planned Days × 100

Compliance %

Measures whether the employee followed the planned roster and attendance requirements.

Compliance % = (Planned Days - Exception Days) / Planned Days × 100

Exception Days

Unique planned working days where an exception occurred.

Mismatch Days

Unique planned working days where roster shift and AMS/actual shift timing do not match.

Planned Days

Working days defined exclusively by the roster.

Planned Hours

Hours expected based exclusively on rostered shifts.

Actual Hours

Hours actually worked according to attendance data.

Never replace Compliance % with Attendance %.

28. Final UX Requirement

The user should be able to answer these questions immediately from the dashboard:

Who is non-compliant?

Why is the employee non-compliant?

On which dates did the exception occur?

Was the employee absent or did they miss attendance marking?

Did they work a different shift than rostered?

What was the expected shift?

What shift did AMS record?

What was the expected check-in?

What was the actual check-in?

How many exception days does the employee have?

What is their attendance percentage?

What is their actual compliance percentage?

The application should make these answers available through the employee summary table, filters, exception badges and daily drill-down without requiring manual Excel analysis.

29. Dynamic Calculation Period – Day / Week / Month

The application must support attendance and roster compliance calculations at three different time granularities:

Daily

Weekly

Monthly

The underlying daily reconciliation logic must remain the same. The application should aggregate the daily records based on the selected calculation period.

30. Period Selector

Add a prominent selector at the top of the Dashboard:

Calculation Period

Options:

Day

Week

Month

Also provide a Date / Period selector beside it.

If Day is selected

Show:

Select Date

Example:

05-May-2026

If Week is selected

Show:

Select Week

Example:

04-May-2026 to 10-May-2026

If Month is selected

Show:

Select Month

Example:

May 2026

The selected period must dynamically update the entire dashboard.

31. Daily Calculation

When:

Calculation Period = Day

the application should calculate all metrics only for the selected date.

Example:

Selected Date:

05-May-2026

For every employee, calculate:

Roster Shift

AMS Shift

Planned Day

Present

Planned Hours

Actual Hours

Shift Mismatch

Missing Attendance

Absent

Exception

Compliance Status

Daily Attendance %

For an individual day:

If Planned Day = 1:

Present = 1 → Attendance = 100%

Present = 0 → Attendance = 0%

If Planned Day = 0:

Attendance % = N/A

Daily Compliance %

If the employee is on a planned working day:

Compliant = 100%

Exception = 0%

If the employee is on WO / Leave / Holiday:

Compliance = N/A

32. Weekly Calculation

When:

Calculation Period = Week

aggregate the daily reconciliation records for the selected week.

Use:

Monday → Sunday

as the default week definition.

Example:

Week:

04-May-2026 to 10-May-2026

For every employee calculate:

Planned Days

Number of working days according to the roster within that week.

Present Days

Number of planned working days where the employee was present.

Exception Days

Number of unique planned working days having an exception.

Mismatch Days

Number of planned working days having a shift mismatch.

Planned Hours

Sum of planned hours for all rostered working days in the selected week.

Actual Hours

Sum of actual hours for the selected week.

Attendance %

Present Days / Planned Days × 100

Compliance %

(Planned Days - Exception Days) / Planned Days × 100

Avg Hours / Day

Actual Hours / Present Days

If Present Days = 0:

Avg Hours / Day = 0

33. Monthly Calculation

When:

Calculation Period = Month

aggregate all daily reconciliation records belonging to the selected month.

Example:

May 2026

Calculate:

Planned Days

Present Days

Attendance %

Planned Hours

Actual Hours

Avg Hours / Day

Mismatch Days

Exception Days

Compliance %

Status

Use:

Attendance % = Present Days / Planned Days × 100

and:

Compliance % = (Planned Days - Exception Days) / Planned Days × 100

34. Period-Aware Employee Summary

The employee summary table must automatically change according to the selected period.

Daily

Employee	Date	Roster	AMS	Present	Exception	Compliance

Weekly

Employee	Week	Planned Days	Present Days	Attendance %	Mismatch Days	Exception Days	Compliance %

Monthly

Employee	Month	Planned Days	Present Days	Attendance %	Mismatch Days	Exception Days	Compliance %

35. Period-Aware Exception Visibility

Exceptions must also change according to the selected period.

Daily

Example:

Palanivel R – 05-May

Shift Timing Mismatch

Roster: G

AMS: A

Expected In: 09:30

Actual In: 07:05

Weekly

Example:

Palanivel R – Week 04-May to 10-May

3 Exceptions

Shift Timing Mismatch: 2

Missing Attendance: 1

Monthly

Example:

Palanivel R – May 2026

5 Exceptions

Shift Timing Mismatch: 3

Missing Attendance: 1

Absent: 1

The exception summary must be generated dynamically from the daily reconciliation table.

36. Period-Aware Dashboard KPIs

All KPI cards must respect the selected period.

For example, if:

Period = Week

show:

Employees

Planned Days

Present Days

Attendance %

Planned Hours

Actual Hours

Avg Hours / Day

Mismatch Days

Exception Days

Compliance %

If:

Period = Day

show the same KPIs but calculated only for the selected date.

If:

Period = Month

show monthly aggregated values.

37. Period Comparison

Add an optional feature:

Compare Periods

Allow users to compare:

Week vs Previous Week

Example:

Week 19:

Compliance = 91%

Previous Week:

Compliance = 87%

Change:

+4 percentage points

Month vs Previous Month

Example:

May:

Compliance = 91%

June:

Compliance = 94%

Change:

+3 percentage points

The comparison should be optional and should not alter the primary calculations.

38. Trend Analysis

For monthly view, provide a trend chart:

Compliance % by Week

Example:

Week	Compliance

Week 1	88%

Week 2	91%

Week 3	94%

Week 4	90%

Also provide:

Attendance % by Week

and:

Exception Days by Week

This allows management to identify whether compliance is improving or deteriorating.

39. Day → Week → Month Drill-Down

Allow users to drill down through the hierarchy:

Month

↓

Week

↓

Day

↓

Employee

↓

Exception Details

Example:

May 2026

→ Week 2

→ 05-May-2026

→ Palanivel R

→ Shift Timing Mismatch

This should use the same underlying daily reconciliation data.

40. Period Filters Must Work With Existing Filters

The period selector must work together with all existing filters.

Example:

Period: Week

Week: 04-May to 10-May

Team: IP Access

Exception: Shift Timing Mismatch

Result:

Only IP Access employees with Shift Timing Mismatch during that selected week should be displayed.

Similarly:

Period: Month

Month: May 2026

Manager: ABC

Status: Non-Compliant

should show only the relevant employees.

41. Period-Aware Export

The export must respect the selected period and filters.

Examples:

Daily Export

Attendance_Compliance_05-May-2026.xlsx

Weekly Export

Attendance_Compliance_Week_04-May_to_10-May-2026.xlsx

Monthly Export

Attendance_Compliance_May-2026.xlsx

The export should contain only records belonging to the selected period and applied filters.

42. Important Calculation Architecture

Do NOT create separate formulas for Daily, Weekly and Monthly calculations.

The calculation hierarchy must be:

Attendance Excel + Roster Excel

↓

Daily Reconciliation

↓

Daily Exception Classification

↓

Daily Metrics

↓

Weekly Aggregation

↓

Monthly Aggregation

This ensures that:

Monthly Compliance = aggregation of daily reconciliation

and:

Weekly Compliance = aggregation of daily reconciliation

rather than recalculating the same logic differently at each level.

43. Period Selection UX

At the top of the dashboard display:

Calculation Period:

[ Day ▼ ] [ 05-May-2026 ▼ ]

or:

[ Week ▼ ] [ 04-May-2026 – 10-May-2026 ▼ ]

or:

[ Month ▼ ] [ May 2026 ▼ ]

When the user changes the period, automatically refresh:

KPI cards

Employee table

Exception counts

Charts

Employee drill-down

Daily reconciliation

Exports

No page refresh should be required.

44. Default Behaviour

When the application is opened:

Default Calculation Period = Month

and:

Default Month = Latest available month in the uploaded data

For example, if the uploaded files contain May 2026 data:

Month = May 2026

If June 2026 data is uploaded later:

Month = June 2026

Do not hardcode May 2026.

The system must dynamically identify the available date range from the uploaded files.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e2df92cb-f858-4db2-b84b-c20d68635a56).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
