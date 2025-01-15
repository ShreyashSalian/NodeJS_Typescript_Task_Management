import { Response, Request } from "express";
import mongoose, { mongo } from "mongoose";
import { Redis } from "ioredis";
import {
  asyncHandler,
  buildSearchPaginationSortingPipeline,
} from "../utils/function";
import { Project } from "../models/project.model";
import { User } from "../models/user.model";

export const addNewProject = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, clientName, projectNumber, createdBy } =
      req.body;
    const projectCreation = await Project.create({
      name,
      description,
      clientName,
      projectNumber,
      createdBy,
    });
    if (projectCreation) {
      return res.status(201).json({
        status: 201,
        message: "Project created successfully.",
        data: null,
        error: null,
      });
    } else {
      return res.status(201).json({
        status: 500,
        message: null,
        data: null,
        error: "Sorry, the project can not be created.",
      });
    }
  }
);

//list the project with the created by user details----------------

// export const listAllProject = asyncHandler(
//   async (req: Request, res: Response) => {
//     const projectDetails = await Project.aggregate([
//       {
//         $lookup: {
//           from: "users",
//           localField: "createdBy",
//           foreignField: "_id",
//           as: "createdByUserDetails",
//         },
//       },
//       {
//         $unwind: {
//           path: "$createdByUserDetails", // Unwind the createdByUserDetails array
//           preserveNullAndEmptyArrays: true, // Include projects even if no user details are found
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           name: 1,
//           description: 1,
//           clientName: 1,
//           "createdByUserDetails.fullName": 1,
//           "createdByUserDetails.userName:": 1,
//           "createdByUserDetails.email": 1,
//           "createdByUserDetails.role": 1,
//           "createdByUserDetails.userName": 1,
//         },
//       },
//     ]);

//     if (projectDetails.length > 0) {
//       return res.status(404).json({
//         status: 200,
//         message: "Project details",
//         data: projectDetails,
//         error: null,
//       });
//     } else {
//       return res.status(404).json({
//         status: 404,
//         message: "No project found.",
//         data: null,
//         error: null,
//       });
//     }
//   }
// );

export const listAllProject = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      search = "",
      page = 1,
      limit = 10,
      sortField = "name",
      sortOrder,
    } = req.body;

    //initialize the redis
    const client = new Redis();
    // Convert query parameters to proper types
    const currentPage = parseInt(page as string, 10) || 10;
    const pageSize = parseInt(limit as string, 10) || 10;

    //Generate unique cache key
    const cacheKey = `projects_${JSON.stringify(
      search
    )}_${currentPage}_${pageSize}_${sortField}_${sortOrder}`;

    //Check redis cache
    const cacheData = await client.get(cacheKey);
    if (cacheData) {
      return res.status(200).json({
        status: 200,
        message: "Project fetched from cache.",
        data: JSON.parse(cacheData),
        error: null,
      });
    }

    // Define searchable fields
    const searchFields = [
      "name",
      "description",
      "createdByUserDetails.fullName",
      "createdByUserDetails.email",
      "createdByUserDetails.role",
      "createdByUserDetails.userName",
    ];

    // Build the aggregation pipeline
    const pipeline = [
      // Lookup to fetch task details for associatedTask
      {
        $lookup: {
          from: "tasks", // The collection name for tasks
          localField: "associatedTask",
          foreignField: "_id",
          as: "taskDetails",
        },
      },
      // Lookup to fetch user details for createdBy field
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByUserDetails",
        },
      },
      {
        $unwind: {
          path: "$createdByUserDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      //Add field to format createdAt to fullDate
      {
        $addFields: {
          formattedCreatedAt: {
            $dateToString: {
              date: "$createdAt",
              format: "%d %B %Y",
              timezone: "UTC",
            },
          },
        },
      },
      // Optionally, project specific fields for output
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          clientName: 1,
          createdAt: 1,
          formattedCreatedAt: 1,
          "createdByUserDetails.fullName": 1,
          "createdByUserDetails.email": 1,
          "createdByUserDetails.role": 1,
          "createdByUserDetails.userName": 1,
          taskDetails: 1, // Include full task details
        },
      },
      // Add search, sorting, and pagination
      ...buildSearchPaginationSortingPipeline(
        searchFields,
        search as string,
        sortField as string,
        sortOrder as "asc" | "desc",
        currentPage,
        pageSize
      ),
    ];

    // Execute the pipeline
    const projectDetails = await Project.aggregate(pipeline);

    // Get total count for pagination
    const totalCountPipeline = pipeline.filter(
      (stage) => !("$skip" in stage || "$limit" in stage)
    );
    const totalCount = await Project.aggregate([
      ...totalCountPipeline,
      { $count: "totalCount" },
    ]);

    const totalProjects = totalCount.length > 0 ? totalCount[0].totalCount : 0;
    if (projectDetails.length === 0) {
      return res.status(200).json({
        status: 200,
        message: "No project has been created.",
        data: { projects: [], totalProjects, totalPages: 0, currentPage },
        error: null,
      });
    }
    //If the project length is greater than zero
    const responeData = {
      projects: projectDetails,
      totalProjects,
      totalPages: Math.ceil(totalProjects / pageSize),
      currentPage,
    };

    //Cache data in Redis
    await client.set(cacheKey, JSON.stringify(responeData), "EX", 30); //Cache expire in 30 seconds
    return res.status(200).json({
      status: 200,
      message: "The list of project",
      data: responeData,
      error: null,
    });
  }
);

//Update the project details------------
export const updateProject = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, clientName, projectNumber, createdBy } =
      req.body;

    const updateProjectDetails = await Project.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          description,
          clientName,
          projectNumber,
          createdBy,
        },
      },
      {
        new: true,
      }
    );
    if (updateProjectDetails) {
      return res.status(201).json({
        status: 201,
        message: "Project updated successfully.",
        data: updateProjectDetails,
        error: null,
      });
    } else {
      return res.status(201).json({
        status: 500,
        message: null,
        data: null,
        error: "Sorry, the project can not be updated.",
      });
    }
  }
);

//delete the projectDetails
export const deleteProject = asyncHandler(
  async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const deleteProjectDetails = await Project.findByIdAndDelete(projectId);
    if (deleteProjectDetails) {
      return res.status(201).json({
        status: 201,
        message: "Project deleted successfully.",
        data: null,
        error: null,
      });
    }
    return res.status(201).json({
      status: 500,
      message: null,
      data: null,
      error: "Sorry, the project cant be deleted.",
    });
  }
);

//Get the project by ID--------------------
export const getProjectByID = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({
          status: 400,
          message: null,
          error: "Invalid project ID format",
          data: null,
        });
      }
      const pipeline = [
        {
          $match: {
            _id: new mongoose.Types.ObjectId(projectId),
          },
        },
        // Lookup to fetch task details for associatedTask
        {
          $lookup: {
            from: "tasks", // The collection name for tasks
            localField: "associatedTask",
            foreignField: "_id",
            as: "taskDetails",
          },
        },
        // Lookup to fetch user details for createdBy field
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByUserDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByUserDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        //Add field to format createdAt to fullDate
        {
          $addFields: {
            projectCreatedOn: {
              $dateToString: {
                date: "$createdAt",
                format: "%d %B %Y",
                timezone: "UTC",
              },
            },
          },
        },
        // Optionally, project specific fields for output
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            // createdAt: 1,
            clientName: 1,
            projectCreatedOn: 1,
            "createdByUserDetails.fullName": 1,
            "createdByUserDetails.email": 1,
            "createdByUserDetails.role": 1,
            "createdByUserDetails.userName": 1,
            taskDetails: 1, // Include full task details
          },
        },
      ];
      const projectAggregation = await Project.aggregate(pipeline);
      if (projectAggregation) {
        return res.status(200).json({
          status: 200,
          message: "The project found.",
          error: null,
          data: projectAggregation[0],
        });
      } else {
        return res.status(400).json({
          status: 400,
          message: null,
          error: "Sorry, no project found",
          data: null,
        });
      }
    } catch (err) {
      return res.status(500).json({
        status: 500,
        data: null,
        message: null,
        error: "Internal server error.",
      });
    }
  }
);
