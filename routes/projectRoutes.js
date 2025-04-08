const express = require('express');
const projectServices = require('../services/projectServices');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const upload = require('../middlewares/upload');
const router = express.Router();

router.route('/')
    .post(verifyToken, authorize("add_project"), upload.any(), projectServices.createProject)
    .get(verifyToken, authorize("view_projects"), projectServices.getAllProjects);

router.route('/:id')
    .get(verifyToken, authorize("view_projects"), projectServices.getSpecificProject)
    .put(verifyToken, authorize("update_project"), upload.any(), projectServices.updateSpecificProject);


router.route('/:id/dates')
    .put(verifyToken, authorize("edit_project_dates"),
        upload.fields([
            { name: 'water_file', maxCount: 1 },
            { name: 'electricity_file', maxCount: 1 },
            { name: 'irrigation_file', maxCount: 1 },
            { name: 'drainage_file', maxCount: 1 }
        ]),
        projectServices.updateProjectDates);

router.route('/:id/videos')
    .put(verifyToken, authorize("edit_project_dates"),
        upload.fields([
            { name: 'aerial_view_file', maxCount: 1 },
            { name: 'illustrative_view_file', maxCount: 1 },
        ]),
        projectServices.updateProjectVideos);

router.route('/:id/values')
    .put(verifyToken, authorize("edit_project_values"),
        upload.any(),
        projectServices.AddProjectValues);

router.put('/soft-delete/:id', verifyToken, authorize("delete_project"), projectServices.softDeleteProject);

module.exports = router;