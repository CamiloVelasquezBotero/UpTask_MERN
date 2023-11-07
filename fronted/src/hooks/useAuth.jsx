import { useContext } from 'react'
import AuthContext from '../context/AuthProvider'

const useAuth = () => {
    return useContext(AuthContext) /* Retornamos todo loq eu nos retorne el context */
}

export default useAuth