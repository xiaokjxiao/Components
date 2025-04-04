import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { supabase } from "../supabase";

const router = express.Router();
const TABLE_NAME = "employees";

// Validation middleware
const validateEmployeeData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("Validating employee data:", req.body);

  const {
    first_name,
    last_name,
    group_name,
    role,
    expected_salary,
    expected_date_of_defense,
  } = req.body;

  if (
    !first_name ||
    !last_name ||
    !group_name ||
    !role ||
    !expected_salary ||
    !expected_date_of_defense
  ) {
    console.log("Missing required fields");
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Validate salary is a number
  if (expected_salary && isNaN(Number(expected_salary))) {
    console.log("Invalid salary format");
    res.status(400).json({ error: "Expected salary must be a number" });
    return;
  }

  // Validate date format 
  if (expected_date_of_defense) {
    console.log("Validating date:", expected_date_of_defense);

    try {
      const date = new Date(expected_date_of_defense);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
    } catch (error) {
      console.log("Invalid date format detected");
      res.status(400).json({ error: "Invalid date format" });
      return;
    }
  }

  console.log("Validation passed");
  next();
};

// Validate ID middleware
const validateEmployeeId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    res.status(400).json({ error: "Invalid employee ID" });
    return;
  }

  next();
};

// Get all employees
router.get("/employees", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from(TABLE_NAME).select("*");

    if (error) throw error;

    const formattedData = data.map((item) => ({
      ...item,
      expected_date_of_defense: new Date(item.expected_date_of_defense),
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create a new employee
router.post(
  "/employees",
  validateEmployeeData,
  async (req: Request, res: Response) => {
    const {
      first_name,
      last_name,
      group_name,
      role,
      expected_salary,
      expected_date_of_defense,
    } = req.body;

    try {
      // This will throw an error if the date is invalid
      // But it should never reach here because of the validation middleware
      const formattedDate = new Date(expected_date_of_defense).toISOString();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([
          {
            first_name,
            last_name,
            group_name,
            role,
            expected_salary,
            expected_date_of_defense: formattedDate,
          },
        ])
        .select();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error) {
      console.error("Error in POST /employees:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Update an employee
router.put(
  "/employees/:id",
  validateEmployeeId,
  validateEmployeeData,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      group_name,
      role,
      expected_salary,
      expected_date_of_defense,
    } = req.body;

    try {
      // Date validation is already done in middleware
      const formattedDate = new Date(expected_date_of_defense).toISOString();

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          first_name,
          last_name,
          group_name,
          role,
          expected_salary,
          expected_date_of_defense: formattedDate,
        })
        .eq("id", id);

      if (error) throw error;

      res.status(200).send("Employee updated successfully");
    } catch (error) {
      console.error("Error in PUT /employees/:id:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Delete an employee
router.delete(
  "/employees/:id",
  validateEmployeeId,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

      if (error) throw error;

      res.status(200).send("Employee deleted successfully");
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

export default router;
