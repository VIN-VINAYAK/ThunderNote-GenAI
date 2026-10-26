import axios from "axios"
import { store } from "../store"
import { CREATE_NOTES_ERROR, CREATE_NOTES_LOADING, CREATE_NOTES_SUCCESS, DELETE_NOTES_ERROR, DELETE_NOTES_LOADING, DELETE_NOTES_SUCCESS, GET_NOTES_ERROR, GET_NOTES_LOADING, GET_NOTES_SUCCESS, UPDATE_NOTES_ERROR, UPDATE_NOTES_LOADING, UPDATE_NOTES_SUCCESS } from "./note_types"
import { BASE_URL } from "../../constants/config"
import { LOGOUT } from "../users/user_types"


export const getNotes = () => async (dispatch) => {
    const {token} = store.getState().userReducer
    dispatch({type: GET_NOTES_LOADING})
    try {
        const res = await axios(BASE_URL+"/note", {
            method: "get",
            headers: {
                Authorization: token
            }
        })
        const { status, data, message } = res.data
        if (status === 1) {
            dispatch({ type: GET_NOTES_SUCCESS, payload: data })
            return { success: true }
        }
        if (status === 2) dispatch({ type: LOGOUT })
        const errorMessage = message || "Unable to load notes."
        dispatch({ type: GET_NOTES_ERROR, payload: errorMessage })
        return { success: false, message: errorMessage }
    } catch (error) {
        const message = error.response?.data?.message || "Unable to load notes. Check your connection and try again."
        dispatch({ type: GET_NOTES_ERROR, payload: message })
        return { success: false, message }
    }
}

export const createNotes = (obj)=>async(dispatch)=>{
    const {token} = store.getState().userReducer
    dispatch({type: CREATE_NOTES_LOADING})
    try {
        const res = await axios(BASE_URL+"/note/create", {
            method: "post",
            data: obj,
            headers: {
                Authorization: token
            }
        })
        const {status, message} = res.data
        if(status === 1)
        {
            dispatch({type: CREATE_NOTES_SUCCESS, payload: message})
            await dispatch(getNotes())
            return {success: true}
        }
        else if(status === 2)
        {
            dispatch({type: LOGOUT})
            dispatch({type: CREATE_NOTES_ERROR, payload: message || "Please sign in again to save notes."})
            return {success: false, message: message || "Please sign in again to save notes."}
        }
        else
        {
            const errorMessage = message || "Unable to save your note. Please try again."
            dispatch({type: CREATE_NOTES_ERROR, payload: errorMessage})
            return {success: false, message: errorMessage}
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Unable to save your note. Check your connection and try again."
        dispatch({type: CREATE_NOTES_ERROR, payload: errorMessage})
        return {success: false, message: errorMessage}
    }
}

export const updateNotes = (id, obj)=>async(dispatch)=>{
    const {token} = store.getState().userReducer
    dispatch({type: UPDATE_NOTES_LOADING})
    try {
        const res = await axios(BASE_URL+"/note/", {
            method: "patch",
            data: obj,
            headers: {
                Authorization: token,
                id: id
            }
        })
        const {status, message} = res.data
        if(status === 1)
        {
            dispatch({type: UPDATE_NOTES_SUCCESS})
            await dispatch(getNotes())
            return { success: true }
        }
        else if(status === 2)
        {
        dispatch({type: LOGOUT})
        const errorMessage = message || "Please sign in again to update notes."
        dispatch({type: UPDATE_NOTES_ERROR, payload: errorMessage})
        return { success: false, message: errorMessage }
        }
        else
        {
            const errorMessage = message || "Unable to update the note. Please try again."
            dispatch({type: UPDATE_NOTES_ERROR, payload: errorMessage})
            return { success: false, message: errorMessage }
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Unable to update the note. Check your connection and try again."
        dispatch({type: UPDATE_NOTES_ERROR, payload: errorMessage})
        return { success: false, message: errorMessage }
    }
}

export const deleteNotes = (id)=>async(dispatch)=>{
    const {token} = store.getState().userReducer
    dispatch({type: DELETE_NOTES_LOADING})
    try {
        const res = await axios(BASE_URL+"/note/", {
            method: "delete",
            headers: {
                Authorization: token,
                id: id
            }
        })
        const {status, message} = res.data
        if(status === 1)
        {
            dispatch({type: DELETE_NOTES_SUCCESS})
            await dispatch(getNotes())
            return { success: true }
        }
        else if(status === 2)
        {
        dispatch({type: LOGOUT})
        const errorMessage = message || "Please sign in again to delete notes."
        dispatch({type: DELETE_NOTES_ERROR, payload: errorMessage})
        return { success: false, message: errorMessage }
        }
        else
        {
            const errorMessage = message || "Unable to delete the note. Please try again."
            dispatch({type: DELETE_NOTES_ERROR, payload: errorMessage})
            return { success: false, message: errorMessage }
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Unable to delete the note. Check your connection and try again."
        dispatch({type: DELETE_NOTES_ERROR, payload: errorMessage})
        return { success: false, message: errorMessage }
    }
}