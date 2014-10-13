exclude_dirs += ['_layouts']
exclude_files += ['pysag.py', 'tag_cloud_info.txt']

data_pages = {
    "projects": {
        "variable": "project",
        "directory": "portfolio",
        "file": "{{ project._id }}.html",
        "template": "_layouts/project.html"
    }
}
