// ---- Define your dialogs  and panels here ----



// ---- Display file structure ----

function make_no_permissions_flag_html() {
    return '<span class="no-perms-flag" title="No permissions set"><span class="fa fa-exclamation-circle no-perms-icon"></span><span class="no-perms-text">No Permissions Set for this File</span></span>'
}

function file_has_any_permission_entries(file_obj) {
    return Object.keys(get_file_users(file_obj)).length > 0
}

function refresh_no_permissions_warnings() {
    $('.file').each(function() {
        let file_elem = $(this)
        let elem_id = file_elem.attr('id')
        if(!elem_id || !elem_id.endsWith('_div')) return

        let filepath = elem_id.substring(0, elem_id.length - 4)
        if(!(filepath in path_to_file)) return

        let has_any_permission_entries = file_has_any_permission_entries(path_to_file[filepath])
        let existing_flag = file_elem.find('.no-perms-flag')

        if(has_any_permission_entries) {
            existing_flag.remove()
        }
        else if(existing_flag.length === 0) {
            file_elem.find('.permbutton').after(make_no_permissions_flag_html())
        }
    })
}

// (recursively) makes and returns an html element (wrapped in a jquery object) for a given file object
function make_file_element(file_obj) {
    let file_hash = get_full_path(file_obj)
    let has_any_permission_entries = file_has_any_permission_entries(file_obj)
    let no_permissions_flag = has_any_permission_entries ? '' : ' ' + make_no_permissions_flag_html()

    if(file_obj.is_folder) {
        let folder_elem = $(`<div class='folder' id="${file_hash}_div">
            <h3 id="${file_hash}_header">
                <span class="oi oi-folder" id="${file_hash}_icon"/> ${file_obj.filename} 
                <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton"> 
                    <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> 
                    Edit Permissions
                </button>
            </h3>
        </div>`)

        // append children, if any:
        if( file_hash in parent_to_children) {
            let container_elem = $("<div class='folder_contents'></div>")
            folder_elem.append(container_elem)
            for(child_file of parent_to_children[file_hash]) {
                let child_elem = make_file_element(child_file)
                container_elem.append(child_elem)
            }
        }
        return folder_elem
    }
    else {
        return $(`<div class='file'  id="${file_hash}_div">
            <span class="oi oi-file" id="${file_hash}_icon"/> ${file_obj.filename}
            <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton"> 
                <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> 
                Edit Permissions
            </button>${no_permissions_flag}
        </div>`)
    }
}

for(let root_file of root_files) {
    let file_elem = make_file_element(root_file)
    $( "#filestructure" ).append( file_elem);    
}

emitter.addEventListener('userEvent', function(e) {
    if(e && e.detail && e.detail.action === ActionEnum.SPECIAL_EVENT && e.detail.data && ('newState' in e.detail.data)) {
        refresh_no_permissions_warnings()
    }
})



// make folder hierarchy into an accordion structure
$('.folder').accordion({
    collapsible: true,
    heightStyle: 'content'
}) // TODO: start collapsed and check whether read permission exists before expanding?


// -- Connect File Structure lock buttons to the permission dialog --

// open permissions dialog when a permission button is clicked
$('.permbutton').click( function( e ) {
    // Set the path and open dialog:
    let path = e.currentTarget.getAttribute('path');
    perm_dialog.attr('filepath', path)
    perm_dialog.dialog('open')
    //open_permissions_dialog(path)

    // Deal with the fact that folders try to collapse/expand when you click on their permissions button:
    e.stopPropagation() // don't propagate button click to element underneath it (e.g. folder accordion)
    // Emit a click for logging purposes:
    emitter.dispatchEvent(new CustomEvent('userEvent', { detail: new ClickEntry(ActionEnum.CLICK, (e.clientX + window.pageXOffset), (e.clientY + window.pageYOffset), e.target.id,new Date().getTime()) }))
});


// ---- Assign unique ids to everything that doesn't have an ID ----
$('#html-loc').find('*').uniqueId() 

$(document).ready(function () {
    $("#perm_entry_header_allow").append(' <span class="info-icon">ⓘ</span>');
    $("#perm_entry_header_deny").append(' <span class="info-icon">ⓘ</span>');
});

$(document).on('mouseenter', '#perm_entry_header_allow', function () {
    $('#perm_entry_header_allow_explanation').show();
});

$(document).on('mouseleave', '#perm_entry_header_allow', function () {
    $('#perm_entry_header_allow_explanation').hide();
});

$(document).on('mouseenter', '#perm_entry_header_deny', function () {
    $('#perm_entry_header_deny_explanation').show();
});

$(document).on('mouseleave', '#perm_entry_header_deny', function () {
    $('#perm_entry_header_deny_explanation').hide();
});

